// Integer Gregorian calendar, UTC. Month boundaries always derive from the original anchor.
pub const DAY:i64=86400;
pub fn days(y:i64,m:i64,d:i64)->i64 {
 let y=y-if m<=2 {1}else{0}; let era=y.div_euclid(400);let yo=y-era*400;
 let mp=m+if m>2 {-3}else{9};let doy=(153*mp+2)/5+d-1;
 era*146097+yo*365+yo/4-yo/100+doy-719468
}
pub fn civil(z:i64)->(i64,i64,i64) {
 let z=z+719468;let era=z.div_euclid(146097);let doe=z-era*146097;
 let yo=(doe-doe/1460+doe/36524-doe/146096)/365;let y=yo+era*400;
 let doy=doe-(365*yo+yo/4-yo/100);let mp=(5*doy+2)/153;
 let d=doy-(153*mp+2)/5+1;let m=mp+if mp<10 {3}else{-9};
 (y+if m<=2 {1}else{0},m,d)
}
pub fn boundary(start:i64,n:u16)->i64 {
 let (y,m,d)=civil(start.div_euclid(DAY));let k=y*12+m-1+n as i64;
 let y=k.div_euclid(12);let m=k.rem_euclid(12)+1;
 let leap=y%4==0&&(y%100!=0||y%400==0);
 let max=match m {2=>if leap {29}else{28},4|6|9|11=>30,_=>31};
 days(y,m,d.min(max))*DAY+start.rem_euclid(DAY)
}
