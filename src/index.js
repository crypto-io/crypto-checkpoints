import CryptoDaemon from 'crypto-daemon';
import { write } from 'crypto-io-utils';
import { log, info, succes} from 'crypto-logger';

export const daemon = new CryptoDaemon();

export const startIPFS = () => {
  return new Promise((resolve, reject) => {
    log('starting ipfs');
    try {
      const IPFS = require('ipfs-api');

      const ipfs = new IPFS({
        PeerID: Math.random(),
        EXPERIMENTAL: {
          pubsub: true,
        },
      });
      succes('starting ipfs');
      resolve(ipfs);
    } catch (error) {
      fail('starting ipfs', error);
      reject(error);
    }
  });
};

export const updateCheckpoints = (ipfs, set) => {
  log('updating checkpoints');
  return new Promise((resolve, reject) => {
    let call = 0;

    if (!ipfs) {
      fail('ipfs not found');
      reject('ipfs not found');
    }

    set = set || [
      {name: 'db', hash: 'QmRGE6LpXchjcZM5h6grF7cftqPUho5yw5Uya5M8qQF9KG'}
    ];
    try {
      set.map(hash => ipfs.name.resolve(hash));

      info('resolving names');
      Promise.all(set.map(obj => {
        call++;
        info(`resolving ${call} of ${set.length}`)
        async function run() {
          const {Path} = await ipfs.name.resolve(obj.hash);
          obj.hash = Path
          return obj;
        }
        return run();
      })).then(json => {
        log('writing checkpoints')
        write('checkpoints.json', JSON.stringify(json)).then(() => {
          succes('writing checkpoints');
          succes('updating checkpoints');
          resolve();
        });
      });
    } catch (error) {
      reject(error);
    }
  });
}

export const start = () => {
  async function run() {
    try {
      await daemon.start();
      const ipfs = await startIPFS(true);
      await updateCheckpoints(ipfs);
      daemon.stop();
    } catch (error) {
      if (error.code === 'CRYPD_DAR') {
        const ipfs = await startIPFS(true)
        await updateCheckpoints(ipfs);
      }
    }
  }
  run();
}
