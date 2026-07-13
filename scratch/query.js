fetch("https://itycbazttpidqlgmmrot.supabase.co/rest/v1/inventory%20list", {
  headers: {
    apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0eWNiYXp0dHBpZHFsZ21tcm90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwNTU3MDEsImV4cCI6MjA1MDYzMTcwMX0.S5Pa5PcYBQiOdJbDvTR_cAHKIfM8uGq-OVONyhpws9o",
    Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0eWNiYXp0dHBpZHFsZ21tcm90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwNTU3MDEsImV4cCI6MjA1MDYzMTcwMX0.S5Pa5PcYBQiOdJbDvTR_cAHKIfM8uGq-OVONyhpws9o"
  }
})
.then(async res => {
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Response text:", text);
})
.catch(err => console.error(err));
