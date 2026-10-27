import mongoose from 'mongoose';

export async function connectDB(uri) {
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log(`✔ MongoDB connected (database: ${mongoose.connection.name})`);
  } catch (err) {
    console.error('\n✖ Could not connect to MongoDB.');
    const msg = String(err?.message || err);
    if (/auth|authentication/i.test(msg)) {
      console.error('  → Username or password in MONGODB_URI is wrong. Check the database user in Atlas > Database Access.');
    } else if (/ENOTFOUND|querySrv|ECONNREFUSED/i.test(msg)) {
      console.error('  → The cluster address could not be reached. Re-copy the connection string from Atlas.');
    } else if (/timed out|Server selection/i.test(msg)) {
      console.error('  → Timed out. Your current IP is probably not allowed in Atlas > Network Access.');
    }
    console.error(`  Details: ${msg}\n`);
    process.exit(1);
  }
}
