// Diagnostic and consent-scoped Photon shared-user provisioning.
 // Never return or log raw phone numbers, API credentials or upstream bodies.
import {getPool} from './db.mjs';

function unwrapUsers(obj) {
  if(Array.isArray(obj))return obj;
  for(const x of [obj?.data,obj?.users,obj?.items,obj?.results,obj?.data?.users,obj?.data?.items]){
    if(Array.isArray(x))return x;
  }
  return null;
}
const normalizePhone = v => typeof v==='string'?v.replace(/[^\d+]/g,''):'';
export async function reconcilePhotonUsers({register=false}={}) {
  const projectId=process.env.IMESSAGE_PROJECT_ID;
  const projectSecret=process.env.IMESSAGE_PROJECT_SECRET;
  if(!projectId || !projectSecret)return {ok:false,error:'photon_credentials_missing'};
  const endpoint=`https://spectrum.photon.codes/projects/${encodeURIComponent(projectId)}/users/`;
  const authorization='Basic '+Buffer.from(`${projectId}:${projectSecret}`).toString('base64');
  const headers={Authorization:authorization,'Content-Type':'application/json'};
  async function provider(method,body) {
    try {
      const res=await fetch(endpoint,{
        method,headers,body:body?JSON.stringify(body):undefined,
        signal:AbortSignal.timeout(12000),cache:'no-store'
      });
      if(!res.ok)return {ok:false,status:res.status};
      const json=await res.json().catch(()=>null);
      return {ok:true,json};
    } catch {
      return {ok:false,status:0};
    }
  }
  const {rows}=await getPool().query(
    `select p.participant_code,c.phone_e164 from diary.participants p
     join diary.contacts c on c.participant_id=p.id
     where p.opted_in=true and p.consent_at is not null
       and p.participant_code<>'P001' order by p.participant_code`
  );
  const unique=new Set(rows.map(x=>x.phone_e164));
  if(unique.size!==rows.length) return {ok:false,error:'duplicate_enrollment_contacts'};
  const retrieved=await provider('GET');
  if(!retrieved.ok)return {ok:false,error:'photon_user_list_failed',status:retrieved.status};
  let users=unwrapUsers(retrieved.json);
  if(!users)return {ok:false,error:'photon_user_list_unexpected'};
  const found=new Set(users.map(u=>normalizePhone(u.phoneNumber)).filter(Boolean));
  let created=0;
  const missing=[];
  for(const row of rows){
    if(found.has(normalizePhone(row.phone_e164)))continue;
    if(register){
      const added=await provider('POST',{type:'shared',phoneNumber:row.phone_e164});
      if(!added.ok)return {ok:false,error:'photon_registration_failed',status:added.status,
        enrolled:rows.length,registered:found.size,created,unregistered:rows.length-created-found.size};
      created++;
      found.add(normalizePhone(row.phone_e164));
    } else {
      missing.push(row.participant_code);
    }
  }
  return {ok:true,enrolled:rows.length,registered_in_photon:rows.length-missing.length,
    newly_registered:created,missing_participant_codes:missing,
    needs_participant_first_message:true};
}
