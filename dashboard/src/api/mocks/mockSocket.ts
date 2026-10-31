import type { Run, RunEvent } from '../../types'
import { mockStore } from './store'

type EventName = 'run:created' | 'run:updated' | 'event:created' | 'connect' | 'disconnect'
type Listener = (data?: unknown) => void

const AGENT_TASKS = [
  'Add distributed tracing spans to the ingestion API',
  'Refactor retry logic with exponential backoff',
  'Write integration tests for the change-stream listener',
  'Migrate schema validation to JSON Schema draft-07',
  'Add query caching layer to MongoDB aggregation pipelines',
]

class MockSocketEmitter {
  private listeners: Map<EventName, Listener[]> = new Map()
  private cycleTimer: ReturnType<typeof setTimeout> | null = null
  private eventTimer: ReturnType<typeof setInterval> | null = null
  private liveRunId: string | null = null
  private liveStep = 1
  private cycleCount = 0

  on(event: EventName, cb: Listener): this {
    const prev = this.listeners.get(event) ?? []
    this.listeners.set(event, [...prev, cb])
    return this
  }

  off(event: EventName, cb: Listener): this {
    const prev = this.listeners.get(event) ?? []
    this.listeners.set(event, prev.filter(l => l !== cb))
    return this
  }

  private emit(event: EventName, data?: unknown) {
    ;(this.listeners.get(event) ?? []).forEach(cb => cb(data))
  }

  connect() {
    // Small delay to simulate connection handshake
    setTimeout(() => {
      this.emit('connect')
      this.scheduleCycle()
    }, 120)
  }

  disconnect() {
    this.emit('disconnect')
    this.stopTimers()
  }

  private stopTimers() {
    if (this.cycleTimer !== null) { clearTimeout(this.cycleTimer); this.cycleTimer = null }
    if (this.eventTimer !== null) { clearInterval(this.eventTimer); this.eventTimer = null }
  }

  private scheduleCycle() {
    // Start a new run every ~10s
    this.cycleTimer = setTimeout(() => this.startLiveRun(), 10_000)
  }

  private startLiveRun() {
    this.cycleCount++
    const isAgent = this.cycleCount % 2 === 0
    const task = AGENT_TASKS[this.cycleCount % AGENT_TASKS.length]
    const sha = Math.random().toString(16).slice(2, 18)

    const run: Run = {
      _id: `run_live_${Date.now()}`,
      project_id: 'proj_alpha',
      source: isAgent ? 'agent' : 'human',
      agent_name: isAgent ? 'claude-code' : undefined,
      triggered_by: 'demo_user',
      commit_sha: sha,
      task_description: isAgent ? task : undefined,
      status: 'running',
      started_at: new Date().toISOString(),
      verdict: undefined,
    }

    // Persist in the mock store so Run Detail page can fetch it
    mockStore.upsertRun(run)
    this.liveRunId = run._id
    this.liveStep = 1
    this.emit('run:created', run)

    // Emit events every 3.5s, then complete after 3 events
    this.eventTimer = setInterval(() => {
      if (!this.liveRunId) { this.stopEventTimer(); return }

      const evt: RunEvent = {
        _id: `evt_live_${Date.now()}`,
        run_id: this.liveRunId,
        type: this.liveStep === 1 ? 'plan_step' : this.liveStep === 2 ? 'command_run' : 'test_result',
        step: this.liveStep,
        payload: this.makePayload(this.liveStep, task),
        timestamp: new Date().toISOString(),
      }
      mockStore.addEvent(evt)
      this.emit('event:created', evt)
      this.liveStep++

      if (this.liveStep > 3) {
        this.stopEventTimer()
        const finalStatus: Run['status'] = Math.random() > 0.25 ? 'success' : 'failed'
        const updated: Run = {
          ...run,
          status: finalStatus,
          ended_at: new Date().toISOString(),
          verdict: finalStatus === 'success' ? 'safe' : 'blocked',
        }
        mockStore.upsertRun(updated)
        this.emit('run:updated', updated)
        this.liveRunId = null
        // Schedule next cycle
        this.scheduleCycle()
      }
    }, 3_500)
  }

  private stopEventTimer() {
    if (this.eventTimer !== null) { clearInterval(this.eventTimer); this.eventTimer = null }
  }

  private makePayload(step: number, task: string): Record<string, unknown> {
    if (step === 1) return { description: task }
    if (step === 2) return { command: 'npm test', exit_code: 0 }
    return { suite: 'integration.test.ts', passed: 8, failed: 0, total: 8 }
  }

  /** Immediately trigger a demo run — called by DemoControls */
  triggerDemoRun(source: 'human' | 'agent' = 'agent', agentName?: string): Run {
    const runId = `run_demo_${Date.now()}`
    const task = source === 'agent'
      ? 'Live demo agent run: optimize database connection pooling'
      : 'npm test -- --runInBand'
    const sha = Math.random().toString(16).slice(2, 18)

    const run: Run = {
      _id: runId,
      project_id: 'proj_alpha',
      source,
      agent_name: agentName,
      triggered_by: 'demo_user',
      commit_sha: sha,
      task_description: task,
      status: 'running',
      started_at: new Date().toISOString(),
    }
    mockStore.upsertRun(run)
    setTimeout(() => this.emit('run:created', run), 80)

    // Emit live events for this demo run
    setTimeout(() => {
      const e1: RunEvent = {
        _id: `evt_demo_1_${Date.now()}`,
        run_id: runId,
        type: source === 'agent' ? 'plan_step' : 'command_run',
        step: 1,
        payload: source === 'agent' ? { description: task } : { command: 'npm test' },
        timestamp: new Date().toISOString(),
      }
      mockStore.addEvent(e1)
      this.emit('event:created', e1)
    }, 1500)

    setTimeout(() => {
      const e2: RunEvent = {
        _id: `evt_demo_2_${Date.now()}`,
        run_id: runId,
        type: source === 'agent' ? 'tool_call' : 'test_result',
        step: 2,
        payload: source === 'agent'
          ? { tool: 'run_command', command: 'npm test -- --runInBand' }
          : { suite: 'pool.test.ts', passed: 6, failed: 0, total: 6 },
        timestamp: new Date().toISOString(),
      }
      mockStore.addEvent(e2)
      this.emit('event:created', e2)
    }, 3200)

    setTimeout(() => {
      const completed: Run = {
        ...run,
        status: 'success',
        ended_at: new Date().toISOString(),
        verdict: 'safe',
      }
      mockStore.upsertRun(completed)
      this.emit('run:updated', completed)
    }, 5500)

    return run
  }

  /** Immediately trigger a diverging run that will fail live and produce divergence data */
  triggerDivergingRun(): Run {
    const runId = `run_diverge_${Date.now()}`
    const task = 'Refactor change-stream listener to persist resumeTokens across restarts'
    const sha = Math.random().toString(16).slice(2, 18)

    const run: Run = {
      _id: runId,
      project_id: 'proj_alpha',
      source: 'agent',
      agent_name: 'claude-code',
      triggered_by: 'demo_user',
      commit_sha: sha,
      task_description: task,
      status: 'running',
      started_at: new Date().toISOString(),
    }

    // Pre-populate divergence and similar failures so detail view works immediately
    const baselineEvent1: RunEvent = {
      _id: 'evt_base_1',
      run_id: 'run_success_baseline',
      type: 'plan_step',
      step: 1,
      payload: { description: 'Read change stream listener configuration' },
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    }
    const baselineEvent2: RunEvent = {
      _id: 'evt_base_2',
      run_id: 'run_success_baseline',
      type: 'command_run',
      step: 2,
      payload: { command: 'git status' },
      timestamp: new Date(Date.now() - 3550000).toISOString(),
    }
    const baselineEvent3: RunEvent = {
      _id: 'evt_base_3',
      run_id: 'run_success_baseline',
      type: 'diff_submitted',
      step: 3,
      payload: { file: 'src/listeners/changeStream.ts', summary: 'Async write to disk using fs.promises.writeFile' },
      timestamp: new Date(Date.now() - 3500000).toISOString(),
    }
    const baselineEvent4: RunEvent = {
      _id: 'evt_base_4',
      run_id: 'run_success_baseline',
      type: 'test_result',
      step: 4,
      payload: { suite: 'changeStream.test.ts', passed: 14, failed: 0, total: 14 },
      timestamp: new Date(Date.now() - 3450000).toISOString(),
    }

    mockStore.upsertRun(run)
    setTimeout(() => this.emit('run:created', run), 80)

    const evt1: RunEvent = {
      _id: `evt_div_1_${Date.now()}`,
      run_id: runId,
      type: 'plan_step',
      step: 1,
      payload: { description: 'Read change stream listener configuration' },
      timestamp: new Date().toISOString(),
    }
    const evt2: RunEvent = {
      _id: `evt_div_2_${Date.now()}`,
      run_id: runId,
      type: 'command_run',
      step: 2,
      payload: { command: 'git status' },
      timestamp: new Date().toISOString(),
    }
    const evt3: RunEvent = {
      _id: `evt_div_3_${Date.now()}`,
      run_id: runId,
      type: 'diff_submitted',
      step: 3,
      payload: {
        file: 'src/listeners/changeStream.ts',
        summary: 'Synchronous blocking fs.writeFileSync on hot change-stream event loop',
      },
      timestamp: new Date().toISOString(),
    }
    const evt4: RunEvent = {
      _id: `evt_div_4_${Date.now()}`,
      run_id: runId,
      type: 'error',
      step: 4,
      payload: { suite: 'changeStream.test.ts', test: 'should maintain low-latency streaming under load' },
      error_message: 'TypeError: Cannot read properties of undefined (reading "resumeToken") at ChangeStreamListener.ts:74',
      timestamp: new Date().toISOString(),
    }

    mockStore.setDivergence({
      run_id: runId,
      baseline_run_id: 'run_success_baseline',
      first_mismatch_step: 3,
      explanation:
        'At step 3, the agent submitted a diff introducing synchronous fs.writeFileSync inside the change-stream loop. The baseline run used async operations. The event loop stalled, causing subsequent token reads to encounter undefined.',
      aligned: [
        { step: 1, baseline: baselineEvent1, current: evt1, match: true },
        { step: 2, baseline: baselineEvent2, current: evt2, match: true },
        { step: 3, baseline: baselineEvent3, current: evt3, match: false },
        { step: 4, baseline: baselineEvent4, current: evt4, match: false },
      ],
    })

    mockStore.setSimilar(runId, [
      {
        run_id: 'run_failed_01',
        event_id: 'evt_f01_5',
        error_message: 'TypeError: Cannot read properties of undefined (reading "resumeToken") at ChangeStreamListener',
        similarity: 0.95,
        created_at: new Date(Date.now() - 480000).toISOString(),
      },
      {
        run_id: 'run_human_f1',
        event_id: 'evt_hf1_err',
        error_message: 'TypeError: Cannot read properties of undefined (reading "resumeToken")',
        similarity: 0.88,
        created_at: new Date(Date.now() - 18000000).toISOString(),
      },
      {
        run_id: 'run_human_f2',
        event_id: 'evt_hf2_err',
        error_message: 'TypeError: Cannot read properties of null (reading "token")',
        similarity: 0.74,
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ])

    // Step 1
    setTimeout(() => {
      mockStore.addEvent(evt1)
      this.emit('event:created', evt1)
    }, 1200)

    // Step 2
    setTimeout(() => {
      mockStore.addEvent(evt2)
      this.emit('event:created', evt2)
    }, 2400)

    // Step 3 (mismatch)
    setTimeout(() => {
      mockStore.addEvent(evt3)
      this.emit('event:created', evt3)
    }, 3600)

    // Step 4 (error) & flip to failed
    setTimeout(() => {
      mockStore.addEvent(evt4)
      this.emit('event:created', evt4)

      const failedRun: Run = {
        ...run,
        status: 'failed',
        ended_at: new Date().toISOString(),
        verdict: 'blocked',
      }
      mockStore.upsertRun(failedRun)
      this.emit('run:updated', failedRun)
    }, 4800)

    return run
  }
}

export const mockSocket = new MockSocketEmitter()
