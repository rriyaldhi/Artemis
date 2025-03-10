import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { LocalStorageService, SessionStorageService } from 'ngx-webstorage';
import { TranslateService } from '@ngx-translate/core';
import { ArtemisTestModule } from '../../test.module';
import { QuizExerciseComponent } from 'app/exercises/quiz/manage/quiz-exercise.component';
import { QuizExerciseService } from 'app/exercises/quiz/manage/quiz-exercise.service';
import { QuizBatch, QuizExercise } from 'app/entities/quiz/quiz-exercise.model';
import { MockSyncStorage } from '../../helpers/mocks/service/mock-sync-storage.service';
import { MockTranslateService } from '../../helpers/mocks/service/mock-translate.service';
import { Course } from 'app/entities/course.model';
import { ExerciseFilter } from 'app/entities/exercise-filter.model';
import { AlertService } from 'app/core/util/alert.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { QuizExerciseImportComponent } from 'app/exercises/quiz/manage/quiz-exercise-import.component';
import { MockNgbModalService } from '../../helpers/mocks/service/mock-ngb-modal.service';
import { ExerciseService } from 'app/exercises/shared/exercise/exercise.service';

describe('QuizExercise Management Component', () => {
    let comp: QuizExerciseComponent;
    let fixture: ComponentFixture<QuizExerciseComponent>;
    let quizExerciseService: QuizExerciseService;
    let exerciseService: ExerciseService;
    let alertService: AlertService;
    let modalService: NgbModal;

    const course = { id: 123 } as Course;
    const quizExercise = new QuizExercise(course, undefined);
    quizExercise.id = 456;
    quizExercise.title = 'Quiz Exercise';
    const quizBatch = new QuizBatch();
    quizBatch.id = 567;
    const route = { snapshot: { paramMap: convertToParamMap({ courseId: course.id }) } } as any as ActivatedRoute;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ArtemisTestModule],
            declarations: [QuizExerciseComponent],
            providers: [
                { provide: ActivatedRoute, useValue: route },
                { provide: LocalStorageService, useClass: MockSyncStorage },
                { provide: SessionStorageService, useClass: MockSyncStorage },
                { provide: TranslateService, useClass: MockTranslateService },
                { provide: NgbModal, useClass: MockNgbModalService },
            ],
        })
            .overrideTemplate(QuizExerciseComponent, '')
            .compileComponents();

        fixture = TestBed.createComponent(QuizExerciseComponent);
        comp = fixture.componentInstance;
        quizExerciseService = fixture.debugElement.injector.get(QuizExerciseService);
        exerciseService = fixture.debugElement.injector.get(ExerciseService);
        alertService = fixture.debugElement.injector.get(AlertService);
        modalService = fixture.debugElement.injector.get(NgbModal);

        comp.course = course;
        comp.quizExercises = [quizExercise];
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('Should call loadExercises on init', () => {
        // GIVEN
        const headers = new HttpHeaders().append('link', 'link;link');
        jest.spyOn(quizExerciseService, 'findForCourse').mockReturnValue(
            of(
                new HttpResponse({
                    body: [quizExercise],
                    headers,
                }),
            ),
        );

        // WHEN
        comp.ngOnInit();

        // THEN
        expect(quizExerciseService.findForCourse).toHaveBeenCalledOnce();
        expect(comp.quizExercises[0]).toEqual(quizExercise);
    });

    it('Should reset quiz', () => {
        const headers = new HttpHeaders().append('link', 'link;link');
        jest.spyOn(exerciseService, 'reset').mockReturnValue(
            of(
                new HttpResponse({
                    body: undefined,
                    headers,
                }),
            ),
        );
        jest.spyOn(quizExerciseService, 'findForCourse');

        comp.ngOnInit();
        comp.resetQuizExercise({ id: 456 } as QuizExercise);
        expect(exerciseService.reset).toHaveBeenCalledWith(456);
        expect(exerciseService.reset).toHaveBeenCalledOnce();
    });

    it('Should open modal', () => {
        const mockReturnValue = { result: Promise.resolve({ id: 456 } as QuizExercise) } as NgbModalRef;
        jest.spyOn(modalService, 'open').mockReturnValue(mockReturnValue);

        comp.openImportModal();
        expect(modalService.open).toHaveBeenCalledWith(QuizExerciseImportComponent, { size: 'lg', backdrop: 'static' });
        expect(modalService.open).toHaveBeenCalledOnce();
    });

    it('Should open quiz for practice', () => {
        const headers = new HttpHeaders().append('link', 'link;link');
        jest.spyOn(quizExerciseService, 'openForPractice').mockReturnValue(
            of(
                new HttpResponse({
                    body: quizExercise,
                    headers,
                }),
            ),
        );

        comp.ngOnInit();
        comp.openForPractice(456);
        expect(quizExerciseService.openForPractice).toHaveBeenCalledWith(456);
        expect(quizExerciseService.openForPractice).toHaveBeenCalledOnce();
    });

    it('Should not open quiz for practice on error', () => {
        const headers = new HttpHeaders().append('link', 'link;link');
        jest.spyOn(quizExerciseService, 'find').mockReturnValue(
            of(
                new HttpResponse({
                    body: quizExercise,
                    headers,
                }),
            ),
        );
        jest.spyOn(quizExerciseService, 'openForPractice').mockReturnValue(throwError(() => new HttpErrorResponse({ error: 'Forbidden', status: 403 })));
        jest.spyOn(alertService, 'error');

        comp.ngOnInit();
        comp.openForPractice(456);
        expect(quizExerciseService.openForPractice).toHaveBeenCalledWith(456);
        expect(quizExerciseService.openForPractice).toHaveBeenCalledOnce();
        expect(alertService.error).toHaveBeenCalledOnce();
        expect(quizExerciseService.find).toHaveBeenCalledWith(456);
        expect(quizExerciseService.find).toHaveBeenCalledOnce();
    });

    it('Should start quiz', () => {
        const headers = new HttpHeaders().append('link', 'link;link');
        jest.spyOn(quizExerciseService, 'start').mockReturnValue(
            of(
                new HttpResponse({
                    body: quizExercise,
                    headers,
                }),
            ),
        );

        comp.ngOnInit();
        comp.startQuiz(456);
        expect(quizExerciseService.start).toHaveBeenCalledWith(456);
        expect(quizExerciseService.start).toHaveBeenCalledOnce();
    });

    it('Should not start quiz on error', () => {
        const headers = new HttpHeaders().append('link', 'link;link');
        jest.spyOn(quizExerciseService, 'find').mockReturnValue(
            of(
                new HttpResponse({
                    body: quizExercise,
                    headers,
                }),
            ),
        );
        jest.spyOn(quizExerciseService, 'start').mockReturnValue(throwError(() => new HttpErrorResponse({ error: 'Forbidden', status: 403 })));
        jest.spyOn(alertService, 'error');

        comp.ngOnInit();
        comp.startQuiz(456);
        expect(quizExerciseService.start).toHaveBeenCalledWith(456);
        expect(quizExerciseService.start).toHaveBeenCalledOnce();
        expect(alertService.error).toHaveBeenCalledOnce();
        expect(quizExerciseService.find).toHaveBeenCalledWith(456);
        expect(quizExerciseService.find).toHaveBeenCalledOnce();
    });

    it('Should end quiz', () => {
        const headers = new HttpHeaders().append('link', 'link;link');
        jest.spyOn(quizExerciseService, 'end').mockReturnValue(
            of(
                new HttpResponse({
                    body: quizExercise,
                    headers,
                }),
            ),
        );

        comp.ngOnInit();
        comp.endQuiz(456);
        expect(quizExerciseService.end).toHaveBeenCalledWith(456);
        expect(quizExerciseService.end).toHaveBeenCalledOnce();
    });

    it('Should add quiz batch', () => {
        const headers = new HttpHeaders().append('link', 'link;link');
        jest.spyOn(quizExerciseService, 'addBatch').mockReturnValue(
            of(
                new HttpResponse({
                    body: quizBatch,
                    headers,
                }),
            ),
        );

        comp.ngOnInit();
        comp.addBatch(456);
        expect(quizExerciseService.addBatch).toHaveBeenCalledWith(456);
        expect(quizExerciseService.addBatch).toHaveBeenCalledOnce();
    });

    it('Should start quiz batch', () => {
        const headers = new HttpHeaders().append('link', 'link;link');
        jest.spyOn(quizExerciseService, 'startBatch').mockReturnValue(
            of(
                new HttpResponse({
                    body: quizBatch,
                    headers,
                }),
            ),
        );

        comp.ngOnInit();
        comp.startBatch(456, 567);
        expect(quizExerciseService.startBatch).toHaveBeenCalledWith(567);
        expect(quizExerciseService.startBatch).toHaveBeenCalledOnce();
    });

    it('Should make quiz visible', () => {
        const headers = new HttpHeaders().append('link', 'link;link');
        jest.spyOn(quizExerciseService, 'setVisible').mockReturnValue(
            of(
                new HttpResponse({
                    body: quizExercise,
                    headers,
                }),
            ),
        );

        comp.ngOnInit();
        comp.showQuiz(456);
        expect(quizExerciseService.setVisible).toHaveBeenCalledWith(456);
        expect(quizExerciseService.setVisible).toHaveBeenCalledOnce();
    });

    it('Should not make quiz visible on error', () => {
        const headers = new HttpHeaders().append('link', 'link;link');
        jest.spyOn(quizExerciseService, 'find').mockReturnValue(
            of(
                new HttpResponse({
                    body: quizExercise,
                    headers,
                }),
            ),
        );
        jest.spyOn(quizExerciseService, 'setVisible').mockReturnValue(throwError(() => new HttpErrorResponse({ error: 'Forbidden', status: 403 })));
        jest.spyOn(alertService, 'error');

        comp.ngOnInit();
        comp.showQuiz(456);
        expect(quizExerciseService.setVisible).toHaveBeenCalledWith(456);
        expect(quizExerciseService.setVisible).toHaveBeenCalledOnce();
        expect(alertService.error).toHaveBeenCalledOnce();
        expect(quizExerciseService.find).toHaveBeenCalledWith(456);
        expect(quizExerciseService.find).toHaveBeenCalledOnce();
    });

    it('Should delete quiz', () => {
        const headers = new HttpHeaders().append('link', 'link;link');
        jest.spyOn(quizExerciseService, 'delete').mockReturnValue(
            of(
                new HttpResponse({
                    body: {},
                    headers,
                }),
            ),
        );

        comp.ngOnInit();
        comp.deleteQuizExercise(456);
        expect(quizExerciseService.delete).toHaveBeenCalledWith(456);
        expect(quizExerciseService.delete).toHaveBeenCalledOnce();
    });

    it('Should export quiz', () => {
        const headers = new HttpHeaders().append('link', 'link;link');
        jest.spyOn(quizExerciseService, 'find').mockReturnValue(
            of(
                new HttpResponse({
                    body: quizExercise,
                    headers,
                }),
            ),
        );
        jest.spyOn(quizExerciseService, 'exportQuiz');

        comp.ngOnInit();
        comp.exportQuizById(456, true);
        expect(quizExerciseService.find).toHaveBeenCalledWith(456);
        expect(quizExerciseService.find).toHaveBeenCalledOnce();
        expect(quizExerciseService.exportQuiz).toHaveBeenCalledWith(undefined, true, 'Quiz Exercise');
        expect(quizExerciseService.exportQuiz).toHaveBeenCalledOnce();
    });

    it('Should return quiz is over', () => {
        quizExercise.quizEnded = true;
        expect(comp.quizIsOver(quizExercise)).toBeTrue();
    });

    it('Should return quiz is not over', () => {
        quizExercise.quizEnded = false;
        expect(comp.quizIsOver(quizExercise)).toBeFalse();
    });

    it('Should return quiz id', () => {
        expect(comp.trackId(0, quizExercise)).toBe(456);
    });

    describe('QuizExercise Search Exercises', () => {
        it('Should show all exercises', () => {
            // WHEN
            comp.exerciseFilter = new ExerciseFilter('Quiz', '', 'quiz');

            // THEN
            expect(comp.quizExercises).toHaveLength(1);
            expect(comp.filteredQuizExercises).toHaveLength(1);
        });

        it('Should show no exercises', () => {
            // WHEN
            comp.exerciseFilter = new ExerciseFilter('Prog', '', 'all');

            // THEN
            expect(comp.quizExercises).toHaveLength(1);
            expect(comp.filteredQuizExercises).toHaveLength(0);
        });
    });
});
