import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostandupService } from './postandup.service';
import { PostandupController } from './postandup.controller';
import { Postandup, PostandupSchema } from './schemas/postandup.schema';
import { User, UserSchema } from '../user/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Postandup.name, schema: PostandupSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [PostandupController],
  providers: [PostandupService],
})
export class PostandupModule {}
