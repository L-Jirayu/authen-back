import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Postandup extends Document {
  @Prop()
  content?: string;

  @Prop()
  imageUrl?: string;

  @Prop({ required: true })
  userId: string;

  @Prop()   
  name?: string;
}

export const PostandupSchema = SchemaFactory.createForClass(Postandup);
