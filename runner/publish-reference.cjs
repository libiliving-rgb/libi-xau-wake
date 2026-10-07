// Publish only a pointer to an already pushed immutable snapshot, never raw prices or secrets.
const fs=require('node:fs'),path=require('node:path');
function writeReference(root,commit,now=Date.now()){
 if(!/^[a-f0-9]{40}$/.test(commit)||!Number.isSafeInteger(now)||now<=0)throw Error('Invalid source reference');
 if(!fs.existsSync(path.join(root,'latest.json')))throw Error('Encrypted snapshot unavailable');
 const reference={format:'libi-xau-source-v1',commit,publishedAt:now};
 fs.writeFileSync(path.join(root,'head.json'),JSON.stringify(reference));return reference;
}
module.exports={writeReference};
if(require.main===module)writeReference(process.env.LIBI_XAU_DATA_DIR||'state',process.argv[2]);
