// Lightweight API client for React Native matching the web client endpoints
import Constants from 'expo-constants';
import { getCurrentCid } from './auth';

const manifest = Constants?.expoConfig || Constants?.manifest || {};
// Try get backend origin from extra, fallback to localhost:5000 in dev
const backendOrigin = manifest?.extra?.backendUrl || 'http://localhost:5000';
const API_BASE = (manifest?.extra?.apiBase) || `${backendOrigin.replace(/\/$/, '')}/api`;

async function request(path, opts = {}){
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers||{}) },
    ...opts,
  });
  if (!res.ok){
    let body = null;
    try { body = await res.json() } catch { try { body = await res.text() } catch {}
    }
    const err = new Error(`Request failed ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function fetchProducts(){
  return request('/products');
}

export async function addToCart({ productId, quantity = 1 } = {}){
  const cid = await getCurrentCid();
  const headers = {};
  if (cid) headers['x-cid'] = cid;
  return request('/cart', { method: 'POST', headers, body: JSON.stringify({ productId, quantity }) });
}

export async function getCart(){
  const cid = await getCurrentCid();
  const headers = {};
  if (cid) headers['x-cid'] = cid;
  return request('/cart', { headers });
}

export async function buyProduct({ productId, quantity = 1 } = {}){
  const cid = await getCurrentCid();
  const headers = {};
  if (cid) headers['x-cid'] = cid;
  const path = `/orders/buy?pid=${encodeURIComponent(String(productId || ''))}&quantity=${encodeURIComponent(String(quantity))}`;
  return request(path, { method: 'POST', headers, body: JSON.stringify({ productId, quantity }) });
}

export default { fetchProducts, addToCart, getCart, buyProduct };
