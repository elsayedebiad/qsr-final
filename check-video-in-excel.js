const XLSX = require('xlsx');

try {
  const wb = XLSX.readFile('data.xlsx');
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, {header: 1});
  
  console.log('Headers:', data[0]);
  
  const videoIndex = data[0].findIndex(h => h && (
    String(h).toLowerCase().includes('video') || 
    String(h).includes('فيديو')
  ));
  
  if(videoIndex !== -1) {
    console.log(`\nVideo column found at index: ${videoIndex}`);
    console.log(`Column name: ${data[0][videoIndex]}\n`);
    console.log('Video Links (first 10 rows):');
    data.slice(1, 11).forEach((row, i) => {
      if(row[videoIndex]) {
        console.log(`${i+1}. ${row[videoIndex]}`);
      }
    });
  } else {
    console.log('\nNo video column found!');
  }
} catch (error) {
  console.error('Error:', error.message);
}
