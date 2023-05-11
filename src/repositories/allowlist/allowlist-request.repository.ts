import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AllowlistModel } from './allowlist.model';
import { Model } from 'mongoose';
import { mapModelToDto } from '../model.dto';
import { AllowlistDto } from './allowlist.dto';

@Injectable()
export class AllowlistRequestRepository {
  constructor(
    @InjectModel(AllowlistModel.name)
    private readonly allowlistRequests: Model<AllowlistModel>,
  ) {}

  async save(request: AllowlistDto): Promise<AllowlistDto> {
    return mapModelToDto(await this.allowlistRequests.create(request));
  }

  async findById(id: string): Promise<AllowlistDto | null> {
    const model = await this.allowlistRequests.findOne({ id });
    if (model) {
      return mapModelToDto(model);
    }
    return null;
  }
}
