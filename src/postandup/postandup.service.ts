import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

import { Postandup } from './schemas/postandup.schema';
import { CreatePostandupDto } from './dto/create-postandup.dto';
import { UpdatePostandupDto } from './dto/update-postandup.dto';
import { User, UserDocument } from '../user/schemas/user.schema'; // <-- ปรับ path ให้ตรงโปรเจกต์

@Injectable()
export class PostandupService {
  constructor(
    @InjectModel(Postandup.name) private readonly postModel: Model<Postandup>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,   // ✅ ดึงชื่อจาก users
  ) {}

  async create(
    createPostandupDto: CreatePostandupDto,
    userId: string,
    file?: Express.Multer.File
  ) {
    if (!userId) throw new UnauthorizedException();

    // ✅ ดึงชื่อจาก users
    const user = await this.userModel
      .findById(new Types.ObjectId(userId))
      .select('name')
      .lean();

    const newPost = new this.postModel({
      ...createPostandupDto,
      userId,
      name: user?.name ?? null,               // ✅ เก็บชื่อไว้ในโพสต์
      imageUrl: file ? file.filename : null,
    });

    return newPost.save();
  }

  // ✅ เติมชื่อให้โพสต์เก่าที่ name:null ก่อนส่งกลับ
  async findAll() {
    const posts = await this.postModel.find().sort({ createdAt: -1 }).lean();

    const missing = posts.filter(p => !p.name && p.userId);
    if (missing.length === 0) return posts;

    const userIds = Array.from(new Set(missing.map(p => String(p.userId))));
    const users = await this.userModel
      .find({ _id: { $in: userIds.map(id => new Types.ObjectId(id)) } })
      .select('name')
      .lean();

    const nameMap = new Map<string, string>();
    users.forEach(u => nameMap.set(String(u._id), u.name));

    // เติมชื่อให้ response (ไม่บังคับอัปเดตลง DB เพื่อความเร็ว)
    return posts.map(p => ({
      ...p,
      name: p.name ?? nameMap.get(String(p.userId)) ?? null,
    }));
  }

  async findOne(id: string) {
    const post = await this.postModel.findById(id).lean();
    if (!post) throw new NotFoundException(`Post with ID ${id} not found`);

    // เติมชื่อกรณีเดี่ยว
    if (!post.name && post.userId) {
      const u = await this.userModel.findById(post.userId).select('name').lean();
      return { ...post, name: u?.name ?? null };
    }
    return post;
  }

  async update(
    id: string,
    updateDto: UpdatePostandupDto,
    userId: string,
    file?: Express.Multer.File
  ) {
    const post = await this.postModel.findById(id).exec();
    if (!post) throw new NotFoundException(`Post with ID ${id} not found`);
    if (String(post.userId) !== String(userId)) throw new UnauthorizedException();

    if (file) {
      if (post.imageUrl) {
        const oldPath = path.join(process.cwd(), 'uploads', post.imageUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      post.imageUrl = file.filename;
    }

    Object.assign(post, updateDto);

    // ถ้าอยากให้แน่ใจว่าโพสต์มี name เสมอ (เผื่อโพสต์เก่า)
    if (!post.name) {
      const u = await this.userModel.findById(userId).select('name').lean();
      post.name = u?.name ?? post.name;
    }

    return post.save();
  }

  async remove(id: string, userId: string) {
    const post = await this.postModel.findById(id).exec();
    if (!post) throw new NotFoundException(`Post with ID ${id} not found`);
    if (String(post.userId) !== String(userId)) throw new UnauthorizedException();

    if (post.imageUrl) {
      const filePath = path.join(process.cwd(), 'uploads', post.imageUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    return this.postModel.findByIdAndDelete(id).exec();
  }
}
