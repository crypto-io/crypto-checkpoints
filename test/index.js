const test = require('tape');
const {startIPFS, updateCheckpoints, daemon} = require('./../dist/checkpoints-node.js');

test('ready', tape => {
  tape.plan(1);
  daemon.start()
    .then(() => startIPFS().then(ipfs => {
      try {
        updateCheckpoints(ipfs).then(() => {
          tape.pass('succes');
          daemon.stop();
        });
      } catch (error) {
        tape.fail(error);
      }
    }))
    .catch((error) => {
      if (error.code === 'CRYPD_DAR') {
        startIPFS().then(ipfs => {
          try {
            updateCheckpoints(ipfs).then(() => {
              tape.pass('succes');
            });
          } catch (error) {
            tape.fail(error);
          }
        });
      } else {
        tape.fail(error);
      }
    });
});
