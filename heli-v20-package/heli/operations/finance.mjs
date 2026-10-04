// Cash model only. No price feed, swap, treasury withdrawal or token issuance.
export const defaults = Object.freeze({days:30,observationsPerDay:24,maintenanceTransactions:2,
 feeLamports:5000,priorityFeeLamports:0,epochRentLamports:2060160,
 applicants:0,applicantRentLamports:6069120,applicantFeeLamports:25000,bufferPercent:25,
 solBalance:0,solFloor:0.005,quoteBalance:0,quotePerSol:100,
 serverQuote:null,rpcQuote:null,identityQuotePerApplicant:null,otherQuote:0,
 monthlyCollectedRevenueQuote:0,volumeQuote:0,retainedFeeBps:0});
function nonnegative(n,key){if(typeof n!=='number'||!Number.isFinite(n)||n<0)throw Error('Invalid '+key);return n;}
export function cashPlan(input={}){
 const c={...defaults,...input};
 for(const [k,v]of Object.entries(c))if(!['serverQuote','rpcQuote','identityQuotePerApplicant'].includes(k)||v!==null)nonnegative(v,k);
 for(const k of ['days','observationsPerDay','maintenanceTransactions','feeLamports','priorityFeeLamports','epochRentLamports','applicants','applicantRentLamports','applicantFeeLamports','bufferPercent','retainedFeeBps'])if(!Number.isSafeInteger(c[k]))throw Error('Integer required: '+k);
 if(c.days<1||c.days>366||c.quotePerSol<=0||c.observationsPerDay>24||c.retainedFeeBps>10000||c.bufferPercent>1000)throw Error('Invalid planning range');
 const transactions=c.days*c.observationsPerDay+c.maintenanceTransactions;
 const maintenanceLamports=transactions*(c.feeLamports+c.priorityFeeLamports)+c.epochRentLamports;
 const userLamports=c.applicants*(c.applicantRentLamports+c.applicantFeeLamports+2*c.priorityFeeLamports);
 if(!Number.isSafeInteger(maintenanceLamports+userLamports))throw Error('Plan exceeds exact lamport range');
 const monthlySol=(maintenanceLamports+userLamports)/1e9*(1+c.bufferPercent/100);
 const unknownCosts=['serverQuote','rpcQuote',...(c.applicants?['identityQuotePerApplicant']:[])].filter(k=>c[k]===null);
 const knownOffchainQuote=(c.serverQuote??0)+(c.rpcQuote??0)+(c.identityQuotePerApplicant??0)*c.applicants+c.otherQuote;
 const revenueQuote=c.monthlyCollectedRevenueQuote; // volume is NOT already-collected revenue
 const solMonths=monthlySol?Math.max(0,c.solBalance-c.solFloor)/monthlySol:null;
 const quoteNet=knownOffchainQuote-revenueQuote;
 const quoteMonths=unknownCosts.length?null:quoteNet>0?c.quoteBalance/quoteNet:null;
 const totalQuoteCost=unknownCosts.length?null:knownOffchainQuote+monthlySol*c.quotePerSol;
 const breakEvenVolumeQuote=totalQuoteCost!==null&&c.retainedFeeBps>0?Math.max(0,totalQuoteCost-revenueQuote)/(c.retainedFeeBps/10000):null;
 const fundsIfConvertedQuote=c.quoteBalance+Math.max(0,c.solBalance-c.solFloor)*c.quotePerSol;
 const monthlyNetAfterConversion=totalQuoteCost===null?null:totalQuoteCost-revenueQuote;
 const conversionRunwayMonths=monthlyNetAfterConversion>0?fundsIfConvertedQuote/monthlyNetAfterConversion:null;
 const limited=[solMonths,quoteMonths].filter(x=>x!==null);
 return {assumptions:c,transactions,maintenanceSol:maintenanceLamports/1e9,userSol:userLamports/1e9,monthlySol,
 unknownCosts,knownOffchainQuote,totalQuoteCost,collectedRevenueQuote:revenueQuote,
 theoreticalFeeRevenueQuote:c.volumeQuote*c.retainedFeeBps/10000,breakEvenVolumeQuote,
 solMonths,quoteMonths,separateWalletRunwayMonths:unknownCosts.length?null:limited.length?Math.min(...limited):null,
 conversionRunwayMonths,conversionRequired:true,
 monthlyShortfallQuote:totalQuoteCost===null?null:Math.max(0,totalQuoteCost-revenueQuote)};
}
