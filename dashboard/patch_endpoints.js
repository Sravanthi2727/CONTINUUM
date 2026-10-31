const fs = require('fs');
let c = fs.readFileSync('dashboard/src/api/endpoints.ts', 'utf8');
const oldLogin = "  const res = await fetch(`${API_URL}/auth/login`, {\r\n    method: 'POST',\r\n    headers: { 'Content-Type': 'application/json' },\r\n    body: JSON.stringify({ email, password }),\r\n  })";
const newLogin = "  let res: Response\r\n  try {\r\n    res = await fetch(`${API_URL}/auth/login`, {\r\n      method: 'POST',\r\n      headers: { 'Content-Type': 'application/json' },\r\n      body: JSON.stringify({ email, password }),\r\n    })\r\n  } catch {\r\n    res = await fetch('/auth/login', {\r\n      method: 'POST',\r\n      headers: { 'Content-Type': 'application/json' },\r\n      body: JSON.stringify({ email, password }),\r\n    })\r\n  }";
const oldRegister = "  const res = await fetch(`${API_URL}/auth/register`, {\r\n    method: 'POST',\r\n    headers: { 'Content-Type': 'application/json' },\r\n    body: JSON.stringify({ email, password, name }),\r\n  })";
const newRegister = "  let res: Response\r\n  try {\r\n    res = await fetch(`${API_URL}/auth/register`, {\r\n      method: 'POST',\r\n      headers: { 'Content-Type': 'application/json' },\r\n      body: JSON.stringify({ email, password, name }),\r\n    })\r\n  } catch {\r\n    res = await fetch('/auth/register', {\r\n      method: 'POST',\r\n      headers: { 'Content-Type': 'application/json' },\r\n      body: JSON.stringify({ email, password, name }),\r\n    })\r\n  }";
c = c.replace(oldLogin, newLogin).replace(oldRegister, newRegister);
fs.writeFileSync('dashboard/src/api/endpoints.ts', c, 'utf8');
console.log('Successfully updated endpoints.ts');
