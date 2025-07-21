const printTime = () => {
  const date = new Date();
  const formattedDate = date.toLocaleString('en-US', {
    timeZone: 'UTC',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true
  });

  console.log('\n');
  console.log(`---------------${formattedDate}---------------`);
};

export default printTime;
