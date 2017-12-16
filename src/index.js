import CryptoDaemon from 'crypto-daemon';
import { write } from 'crypto-io-utils';
import { log, info, succes} from 'crypto-logger';
const daemon = new CryptoDaemon();

const startIPFS = exclusiveDaemon => {
  log('updating checkpoints');

  const IPFS = require('ipfs-api');

  const ipfs = new IPFS({
    PeerID: Math.random(),
    EXPERIMENTAL: {
      pubsub: true,
    },
  });

  const set = [
    {name: 'db', hash: 'QmRGE6LpXchjcZM5h6grF7cftqPUho5yw5Uya5M8qQF9KG'}
  ]
  set.map(hash => ipfs.name.resolve(hash));

  info('resolving names');
  let call = 0;
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
      if (exclusiveDaemon) daemon.stop();
    });
  });

};

daemon.start()
  .then(() => startIPFS(true))
  .catch(error => {if (error.code === 'CRYPD_DAR') startIPFS(false)});
