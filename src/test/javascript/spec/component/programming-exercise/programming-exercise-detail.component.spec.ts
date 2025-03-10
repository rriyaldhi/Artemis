import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ArtemisTestModule } from '../../test.module';
import { ProgrammingExerciseDetailComponent } from 'app/exercises/programming/manage/programming-exercise-detail.component';
import { ProgrammingExercise } from 'app/entities/programming-exercise.model';
import { MockActivatedRoute } from '../../helpers/mocks/activated-route/mock-activated-route';
import { Course } from 'app/entities/course.model';
import { TranslateModule } from '@ngx-translate/core';
import { StatisticsService } from 'app/shared/statistics-graph/statistics.service';
import { ExerciseManagementStatisticsDto } from 'app/exercises/shared/statistics/exercise-management-statistics-dto';
import { ProfileService } from 'app/shared/layouts/profiles/profile.service';
import { MockProfileService } from '../../helpers/mocks/service/mock-profile.service';
import { Exam } from 'app/entities/exam.model';
import { ProgrammingExerciseGradingService } from 'app/exercises/programming/manage/services/programming-exercise-grading.service';
import { MockProgrammingExerciseService } from '../../helpers/mocks/service/mock-programming-exercise.service';
import { ProgrammingExerciseService } from 'app/exercises/programming/manage/services/programming-exercise.service';
import { MockProvider } from 'ng-mocks';
import { AlertService, AlertType } from 'app/core/util/alert.service';
import { MockNgbModalService } from '../../helpers/mocks/service/mock-ngb-modal.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MockSyncStorage } from '../../helpers/mocks/service/mock-sync-storage.service';
import { LocalStorageService, SessionStorageService } from 'ngx-webstorage';
import { MockProgrammingExerciseGradingService } from '../../helpers/mocks/service/mock-programming-exercise-grading.service';
import { ProgrammingExerciseGitDiffReport } from 'app/entities/hestia/programming-exercise-git-diff-report.model';
import { ProgrammingExerciseSolutionEntry } from 'app/entities/hestia/programming-exercise-solution-entry.model';
import { GitDiffReportModalComponent } from 'app/exercises/programming/hestia/git-diff-report/git-diff-report-modal.component';

describe('ProgrammingExercise Management Detail Component', () => {
    let comp: ProgrammingExerciseDetailComponent;
    let fixture: ComponentFixture<ProgrammingExerciseDetailComponent>;
    let statisticsService: StatisticsService;
    let exerciseService: ProgrammingExerciseService;
    let modalService: NgbModal;
    let alertService: AlertService;
    let statisticsServiceStub: jest.SpyInstance;
    let gitDiffReportStub: jest.SpyInstance;

    const exerciseStatistics = {
        averageScoreOfExercise: 50,
        maxPointsOfExercise: 10,
        absoluteAveragePoints: 5,
        scoreDistribution: [5, 0, 0, 0, 0, 0, 0, 0, 0, 5],
        numberOfExerciseScores: 10,
        numberOfParticipations: 10,
        numberOfStudentsOrTeamsInCourse: 10,
        participationsInPercent: 100,
        numberOfPosts: 4,
        numberOfResolvedPosts: 2,
        resolvedPostsInPercent: 50,
    } as ExerciseManagementStatisticsDto;

    const gitDiffReport = {
        templateRepositoryCommitHash: 'x1',
        solutionRepositoryCommitHash: 'x2',
        entries: [
            {
                previousFilePath: '/src/test.java',
                filePath: '/src/test.java',
                previousStartLine: 1,
                startLine: 1,
                previousLineCount: 2,
                lineCount: 2,
            },
        ],
    } as ProgrammingExerciseGitDiffReport;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ArtemisTestModule, TranslateModule.forRoot()],
            declarations: [ProgrammingExerciseDetailComponent],
            providers: [
                MockProvider(AlertService),
                { provide: LocalStorageService, useClass: MockSyncStorage },
                { provide: SessionStorageService, useClass: MockSyncStorage },
                { provide: ActivatedRoute, useValue: new MockActivatedRoute() },
                { provide: ProfileService, useValue: new MockProfileService() },
                { provide: ProgrammingExerciseGradingService, useValue: new MockProgrammingExerciseGradingService() },
                { provide: ProgrammingExerciseService, useValue: new MockProgrammingExerciseService() },
                { provide: NgbModal, useValue: new MockNgbModalService() },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(ProgrammingExerciseDetailComponent);
        comp = fixture.componentInstance;
        statisticsService = fixture.debugElement.injector.get(StatisticsService);
        statisticsServiceStub = jest.spyOn(statisticsService, 'getExerciseStatistics').mockReturnValue(of(exerciseStatistics));
        alertService = fixture.debugElement.injector.get(AlertService);
        exerciseService = fixture.debugElement.injector.get(ProgrammingExerciseService);
        gitDiffReportStub = jest.spyOn(exerciseService, 'getDiffReport').mockReturnValue(of(gitDiffReport));
        modalService = fixture.debugElement.injector.get(NgbModal);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('Should open git-diff', () => {
        const programmingExercise = new ProgrammingExercise(new Course(), undefined);
        programmingExercise.id = 123;
        comp.programmingExercise = programmingExercise;

        jest.spyOn(modalService, 'open');

        comp.showGitDiff();

        expect(modalService.open).toHaveBeenCalledOnce();
        expect(modalService.open).toHaveBeenCalledWith(GitDiffReportModalComponent, { size: 'xl' });
    });

    describe('OnInit for course exercise', () => {
        const programmingExercise = new ProgrammingExercise(new Course(), undefined);
        programmingExercise.id = 123;

        beforeEach(() => {
            const route = TestBed.inject(ActivatedRoute);
            route.data = of({ programmingExercise });
        });

        it('Should not be in exam mode', () => {
            // WHEN
            comp.ngOnInit();

            // THEN
            expect(statisticsServiceStub).toHaveBeenCalledOnce();
            expect(gitDiffReportStub).toHaveBeenCalledOnce();
            expect(comp.programmingExercise).toEqual(programmingExercise);
            expect(comp.isExamExercise).toBeFalse();
            expect(comp.doughnutStats.participationsInPercent).toBe(100);
            expect(comp.doughnutStats.resolvedPostsInPercent).toBe(50);
            expect(comp.doughnutStats.absoluteAveragePoints).toBe(5);
            expect(comp.programmingExercise.gitDiffReport).toBeDefined();
            expect(comp.programmingExercise.gitDiffReport?.entries).toHaveLength(1);
        });
    });

    describe('OnInit for exam exercise', () => {
        const exam = { id: 4, course: { id: 6 } as Course } as Exam;
        const exerciseGroup = { id: 9, exam };
        const programmingExercise = new ProgrammingExercise(undefined, undefined);
        programmingExercise.id = 123;
        programmingExercise.exerciseGroup = exerciseGroup;

        beforeEach(() => {
            const route = TestBed.inject(ActivatedRoute);
            route.data = of({ programmingExercise });
        });

        it('Should be in exam mode', () => {
            // WHEN
            comp.ngOnInit();

            // THEN
            expect(statisticsServiceStub).toHaveBeenCalledOnce();
            expect(gitDiffReportStub).toHaveBeenCalledOnce();
            expect(comp.programmingExercise).toEqual(programmingExercise);
            expect(comp.isExamExercise).toBeTrue();
            expect(comp.programmingExercise.gitDiffReport).toBeDefined();
            expect(comp.programmingExercise.gitDiffReport?.entries).toHaveLength(1);
        });
    });

    it('Should create structural solution entries', () => {
        const programmingExercise = new ProgrammingExercise(new Course(), undefined);
        programmingExercise.id = 123;
        comp.programmingExercise = programmingExercise;

        jest.spyOn(exerciseService, 'createStructuralSolutionEntries').mockReturnValue(of([] as ProgrammingExerciseSolutionEntry[]));
        jest.spyOn(alertService, 'addAlert');

        comp.createStructuralSolutionEntries();

        expect(exerciseService.createStructuralSolutionEntries).toHaveBeenCalledOnce();
        expect(alertService.addAlert).toHaveBeenCalledOnce();
        expect(alertService.addAlert).toHaveBeenCalledWith({
            type: AlertType.SUCCESS,
            message: 'artemisApp.programmingExercise.createStructuralSolutionEntriesSuccess',
        });
    });

    it('Should create behavioral solution entries', () => {
        const programmingExercise = new ProgrammingExercise(new Course(), undefined);
        programmingExercise.id = 123;
        comp.programmingExercise = programmingExercise;

        jest.spyOn(exerciseService, 'createBehavioralSolutionEntries').mockReturnValue(of([] as ProgrammingExerciseSolutionEntry[]));
        jest.spyOn(alertService, 'addAlert');

        comp.createBehavioralSolutionEntries();

        expect(exerciseService.createBehavioralSolutionEntries).toHaveBeenCalledOnce();
        expect(alertService.addAlert).toHaveBeenCalledOnce();
        expect(alertService.addAlert).toHaveBeenCalledWith({
            type: AlertType.SUCCESS,
            message: 'artemisApp.programmingExercise.createBehavioralSolutionEntriesSuccess',
        });
    });
});
