const timeout = (
  {
    delay,
    err,
  }: {
    delay?: number;
    err?: any;
  } = { delay: 5000, err: 'timeout' }
) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(err);
    }, delay);
  });
};

export default timeout;
