import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LectureText } from './entities/lecture-text.entity';
import { LectureQuestion } from './entities/lecture-question.entity';
import { LectureSession } from './entities/lecture-session.entity';
import { LectureProgression } from './entities/lecture-progression.entity';
import { LectureService } from './lecture.service';
import { LectureGameController } from './lecture-game.controller';
import { LectureAdminController } from './lecture-admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LectureText,
      LectureQuestion,
      LectureSession,
      LectureProgression,
    ]),
  ],
  controllers: [LectureGameController, LectureAdminController],
  providers: [LectureService],
})
export class LectureModule {}
