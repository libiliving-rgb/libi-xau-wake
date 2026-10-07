const BAR_MS=300000,MAX_AGE_MS=300000;
// A historical five-minute candle is an interval, not an exact tick timestamp.
function eventTiming(e){
 const p=e.payload??{},recordedAt=e.createdAt;
 if(!Number.isFinite(recordedAt))return null;
 const interval=Number.isFinite(p.barAt);
 const effectiveAt=e.eventType==='NEW_SIGNAL'?recordedAt:p.effectiveAt;
 if(!Number.isFinite(effectiveAt)||effectiveAt>recordedAt||interval&&p.barAt!==effectiveAt)return null;
 const eventAt=effectiveAt+(interval?BAR_MS:0);
 if(eventAt>recordedAt)return null;
 return {eventAt,effectiveAt,recordedAt,timePrecision:interval?'5m interval':'observation'};
}
function eligibleEvent(state,e,now,subscribedAt){
 const timing=eventTiming(e);if(!timing||timing.eventAt<subscribedAt||timing.eventAt>now||now-timing.eventAt>MAX_AGE_MS)return null;
 if(e.eventType==='NEW_SIGNAL'&&(state.status!=='pending-entry'||!e.signalHash||e.signalHash!==state.signalHash))return null;
 if(e.eventType==='ENTRY_REACHED'&&(state.status!=='triggered'||!e.signalHash||e.signalHash!==state.signalHash))return null;
 return timing;
}
module.exports={eventTiming,eligibleEvent};
