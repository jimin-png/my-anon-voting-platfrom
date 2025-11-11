// models/Vote.ts
import mongoose, { Schema, models, Model, Types } from 'mongoose';

export interface IVote {
  voter: Types.ObjectId;
  candidate: string;
  timestamp?: Date;
  txHash?: string;
}

const VoteSchema = new Schema<IVote>({
  voter: { type: Schema.Types.ObjectId, ref: 'Voter', required: true },
  candidate: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  txHash: { type: String },
});

const Vote: Model<IVote> =
  (models.Vote as Model<IVote>) || mongoose.model<IVote>('Vote', VoteSchema);
export default Vote;
