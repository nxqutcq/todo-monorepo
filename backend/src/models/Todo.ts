import { Schema, model, Document, Types } from "mongoose";

export interface ITodo extends Document {
  title: string;
  completed: boolean;
  userId: Types.ObjectId;
  attachmentKey?: string;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const todoSchema = new Schema<ITodo>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    attachmentKey: {
      type: String,
    },
    dueDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

todoSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) {
    const value = ret as { id?: string; _id?: unknown };
    value.id = String(value._id);
    delete value._id;
  },
});

export const Todo = model<ITodo>("Todo", todoSchema);
