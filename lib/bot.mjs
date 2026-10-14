import {Chat} from 'chat';
import {createiMessageAdapter} from '@photon-ai/chat-adapter-imessage';
import {createPostgresState} from '@chat-adapter/state-pg';
import {getPool,processIncoming,flushOutbox} from './db.mjs';

export const bot=new Chat({
  userName:'diarybot',
  adapters:{imessage:createiMessageAdapter({
    projectId:process.env.IMESSAGE_PROJECT_ID,
    projectSecret:process.env.IMESSAGE_PROJECT_SECRET,
  })},
  state:createPostgresState({client:getPool(),keyPrefix:'diarybot'})
});

// Inbound DMs always take priority. Ignore unknown numbers, never auto-enroll strangers.
bot.onDirectMessage(async (_thread,message)=>{
  await processIncoming({phone:message.author?.userId,messageId:message.id,text:message.text??''});
  await flushOutbox(bot,8);
});
