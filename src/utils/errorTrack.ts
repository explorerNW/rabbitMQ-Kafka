const errorTypes = ['unhandledRejection', 'uncaughtException']
const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2']

export const errorTrack = () => {
    errorTypes.forEach(type => {
        process.on(type, async e => {
          try {
            console.log(`process.on ${type}`);
            console.error(e);
            
            process.exit(0);
          } catch (_) {
            process.exit(1);
          }
        });
      });
      
      signalTraps.forEach(type => {
        process.once(type, async () => {
          try {
            
          } finally {
            process.kill(process.pid, type);
          }
        });
      });
};