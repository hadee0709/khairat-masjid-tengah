export async function GET() {
  const csv =
    "\uFEFFfull_name,identification_no,phone,email,address,postcode,area,category,joined_on,status,notes\nAhmad Bin Ali,800101071234,0123456789,ahmad@example.com,Alamat ahli,11900,Kawasan Tengah,Ahli Biasa,2026-01-01,active,Contoh rekod";
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=templat-import-ahli.csv",
    },
  });
}
