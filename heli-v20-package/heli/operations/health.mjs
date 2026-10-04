export function assess(health,{now=Date.now(),staleMs=300000}={}){
 const alerts=[];const add=(level,code,text)=>alerts.push({level,code,text});
 if(!health)return {ready:false,severity:'critical',alerts:[{level:'critical',code:'not-started',text:'Çalıştırıcıdan henüz durum alınmadı. Canlı hizmet başlamadı.'}]};
 const timestamp=Date.parse(health.time),age=now-timestamp;
 if(!Number.isFinite(timestamp)||age< -60000||age>staleMs)add('critical','stale','Hizmetin durum bilgisi güncel değil; süreç veya bağlantı durmuş olabilir.');
 if(health.mode!=='devnet-execute')add('warning','dry-run','Salt plan modu: zincire işlem gönderilmiyor.');
 const stops={'rpc-or-safety-stop':'Ağ veya güven kontrolü nedeniyle işlem gönderilemiyor.','insufficient-balance':'İşlem gideri cüzdanının bakiyesi yetersiz.','budget-exhausted':'Günlük gider tavanına ulaşıldı.','expired-unknown':'Eski işlemin sonucu belirsiz; operatör incelemesi gerekiyor.','failed':'Son işlem zincirde reddedildi.','uncertain':'Gönderilen işlemin yanıtı belirsiz; aynı imza izleniyor.'};
 if(stops[health.status])add(['uncertain'].includes(health.status)?'warning':'critical',health.status,stops[health.status]);
 if(health.status==='blocked'||health.status==='backoff')add('warning','waiting','Ön kontrol veya işlem reddinden sonra bekleniyor; gerçek gider aktarılmadığı varsayılmamalı.');
 if(health.status==='essential-reserve')add('warning','essential-reserve','Sonraki aylık bakımın SOL payı korunuyor; fiyat gözlemi gönderilmedi.');
 const t=health.telemetry;
 if(t?.overdueMonths>0)add('warning','backlog',`${t.overdueMonths} aylık kapanış sırada bekliyor.`);
 if(t?.manifestBound&&!t?.paused&&!t?.closed&&Number.isFinite(t?.lastObservation)&&t.chainTime-t.lastObservation>7200)add('warning','observation-gap','Fiyat gözlemlerinde iki saati aşan boşluk var; kilitli satışlar etkilenebilir.');
 if(t?.balanceLamports!==null&&Number.isSafeInteger(t?.balanceLamports)&&Number.isSafeInteger(t?.reserveLamports)&&t.balanceLamports<t.reserveLamports)add('critical','balance-floor','İşlem cüzdanı asgari bakiyenin altında.');
 if(t?.balanceTime&&now-Date.parse(t.balanceTime)>staleMs)add('warning','old-balance','Son cüzdan bakiyesi ölçümü güncel değil.');
 if(health.mode==='devnet-execute'&&!t?.snapshotTime)add('warning','no-chain-snapshot','Doğrulanmış zincir durumu henüz alınmadı.');
 if(health.mode==='devnet-execute'&&!t?.balanceTime)add('warning','no-balance','İşlem cüzdanının bakiyesi henüz ölçülmedi.');
 if(t?.snapshotTime&&now-Date.parse(t.snapshotTime)>staleMs)add('critical','old-chain-snapshot','Zincir durumunun son doğrulaması güncel değil.');
 const severity=alerts.some(a=>a.level==='critical')?'critical':alerts.length?'warning':'ok';
 return {ready:severity==='ok'&&health.mode==='devnet-execute',severity,alerts};
}
// Public monitoring exposes only explicit fields. Never export journal/config/raw errors.
export function publicHealth(h){
 if(!h)return null;const t=h.telemetry??{},out={};
 for(const k of ['snapshotTime','chainTime','lastSettledMonth','overdueMonths','paused','closed','manifestBound','observationCount','lastObservation','balanceLamports','balanceTime','reserveLamports','dailyCapLamports','reservedTodayLamports'])if(Object.hasOwn(t,k))out[k]=t[k];
 return {time:h.time,mode:h.mode,status:h.status,failures:h.failures??0,job:h.job?{name:h.job.name,number:h.job.number}:null,telemetry:out};
}
