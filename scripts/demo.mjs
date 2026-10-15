import {QUESTIONS, FINISH, parseAnswer} from '../lib/diary.mjs';
let activity;
const responses=['1','4','4','1','2'];
console.log('SIMULATION — no messages are sent and no data is saved\n');
for(let step=1;step<=5;step++){
 console.log(`BOT: ${QUESTIONS[step](1,activity)}\nYOU: ${responses[step-1]}\n`);
 const answer=parseAnswer(step,responses[step-1],activity);
 if(step===1)activity=answer.activity;
}
console.log(`BOT: ${FINISH}`);
