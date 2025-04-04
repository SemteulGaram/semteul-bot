import nodeFetch from 'node-fetch';
import { Logger } from '@/logger';

const log = new Logger({
  parentHierarchy: ['bot-file-fetch'],
});
export function buildBotFileFetchUrl(filePath: string): string {
  const fullUrl = `https://api.telegram.org/file/bot${process.env.TOKEN}/${filePath}`;
  return fullUrl;
}

export async function botFileFetch(
  filePath: string,
): Promise<NodeJS.ReadableStream> {
  log.trace('request ' + filePath);
  const url = buildBotFileFetchUrl(filePath);
  const res = await nodeFetch(url);
  if (!res.body) {
    throw new Error('Failed to fetch file');
  }
  return res.body;
  // return new Promise<NodeJS.ReadableStream>((resolve, reject) => {
  //   try {
  //     const req = https.request(
  //       {
  //         hostname: 'api.telegram.org',
  //         path: `/file/bot${process.env.TOKEN}/${filePath}`,
  //         method: 'GET',
  //       },
  //       (res) => {
  //         resolve(res);
  //       },
  //     );
  //     req.on('error', (err) => {
  //       log.error(err);
  //       reject(err);
  //     });
  //     log.trace('request sent');
  //   } catch (err) {
  //     log.error(err);
  //     reject(err);
  //   }
  // });
}
