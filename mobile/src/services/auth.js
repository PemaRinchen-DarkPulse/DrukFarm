import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getCurrentCid(){
  const keys = ['cid','CID','user','authUser','currentUser'];
  for (const k of keys){
    try {
      const v = await AsyncStorage.getItem(k);
      if (!v) continue;
      if (/^\d{11}$/.test(v)) return v;
      try {
        const obj = JSON.parse(v);
        if (typeof obj === 'string' && /^\d{11}$/.test(obj)) return obj;
        if (obj && obj.cid && /^\d{11}$/.test(obj.cid)) return obj.cid;
      } catch {}
    } catch {}
  }
  return null;
}

export default { getCurrentCid };
