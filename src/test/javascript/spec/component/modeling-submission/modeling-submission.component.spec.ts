import * as ace from 'brace';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { ArtemisTestModule } from '../../test.module';
import { ModelingSubmissionComponent } from 'app/exercises/modeling/participate/modeling-submission.component';
import { ModelingSubmissionService } from 'app/exercises/modeling/participate/modeling-submission.service';
import { ModelingSubmission } from 'app/entities/modeling-submission.model';
import { MockSyncStorage } from '../../helpers/mocks/service/mock-sync-storage.service';
import { MockParticipationWebsocketService } from '../../helpers/mocks/service/mock-participation-websocket.service';
import { MockCookieService } from '../../helpers/mocks/service/mock-cookie.service';
import { LocalStorageService, SessionStorageService } from 'ngx-webstorage';
import { CookieService } from 'ngx-cookie-service';
import { TranslateService } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { ParticipationWebsocketService } from 'app/overview/participation-websocket.service';
import { ChangeDetectorRef, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { MockComplaintService } from '../../helpers/mocks/service/mock-complaint.service';
import dayjs from 'dayjs';
import { MockComponent, MockPipe, MockProvider } from 'ng-mocks';
import { DeviceDetectorService } from 'ngx-device-detector';
import { ModelingEditorComponent } from 'app/exercises/modeling/shared/modeling-editor.component';
import { ModelingExercise, UMLDiagramType } from 'app/entities/modeling-exercise.model';
import { ComplaintService } from 'app/complaints/complaint.service';
import { StudentParticipation } from 'app/entities/participation/student-participation.model';
import { Result } from 'app/entities/result.model';
import { routes } from 'app/exercises/modeling/participate/modeling-participation.route';
import { AssessmentType } from 'app/entities/assessment-type.model';
import { Feedback, FeedbackType } from 'app/entities/feedback.model';
import { JhiWebsocketService } from 'app/core/websocket/websocket.service';
import { HtmlForMarkdownPipe } from 'app/shared/pipes/html-for-markdown.pipe';
import { UMLElement, UMLModel } from '@ls1intum/apollon';
import { MockTranslateService } from '../../helpers/mocks/service/mock-translate.service';
import { HeaderParticipationPageComponent } from 'app/exercises/shared/exercise-headers/header-participation-page.component';
import { ButtonComponent } from 'app/shared/components/button.component';
import { ResizeableContainerComponent } from 'app/shared/resizeable-container/resizeable-container.component';
import { TeamParticipateInfoBoxComponent } from 'app/exercises/shared/team/team-participate/team-participate-info-box.component';
import { TeamSubmissionSyncComponent } from 'app/exercises/shared/team-submission-sync/team-submission-sync.component';
import { ModelingAssessmentComponent } from 'app/exercises/modeling/assess/modeling-assessment.component';
import { FullscreenComponent } from 'app/shared/fullscreen/fullscreen.component';
import { AdditionalFeedbackComponent } from 'app/shared/additional-feedback/additional-feedback.component';
import { RatingComponent } from 'app/exercises/shared/rating/rating.component';
import { ArtemisTranslatePipe } from 'app/shared/pipes/artemis-translate.pipe';
import { AlertComponent } from 'app/shared/alert/alert.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { ComplaintsStudentViewComponent } from 'app/complaints/complaints-for-students/complaints-student-view.component';
import { HttpResponse } from '@angular/common/http';
import { GradingInstruction } from 'app/exercises/shared/structured-grading-criterion/grading-instruction.model';
import { AlertService } from 'app/core/util/alert.service';

describe('ModelingSubmission Management Component', () => {
    // needed to make sure ace is defined
    ace.acequire('ace/ext/modelist.js');
    let comp: ModelingSubmissionComponent;
    let fixture: ComponentFixture<ModelingSubmissionComponent>;
    let debugElement: DebugElement;
    let service: ModelingSubmissionService;
    let alertService: AlertService;
    let router: Router;

    const route = { params: of({ courseId: 5, exerciseId: 22, participationId: 123 }) } as any as ActivatedRoute;
    const participation = new StudentParticipation();
    participation.exercise = new ModelingExercise(UMLDiagramType.ClassDiagram, undefined, undefined);
    participation.id = 1;
    const submission = <ModelingSubmission>(<unknown>{ id: 20, submitted: true, participation });
    const result = { id: 1 } as Result;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ArtemisTestModule, RouterTestingModule.withRoutes([routes[0]])],
            declarations: [
                ModelingSubmissionComponent,
                MockComponent(ModelingEditorComponent),
                MockPipe(HtmlForMarkdownPipe),
                MockPipe(ArtemisTranslatePipe),
                MockComponent(HeaderParticipationPageComponent),
                MockComponent(ButtonComponent),
                MockComponent(ResizeableContainerComponent),
                MockComponent(TeamParticipateInfoBoxComponent),
                MockComponent(TeamSubmissionSyncComponent),
                MockComponent(ModelingAssessmentComponent),
                MockComponent(FullscreenComponent),
                MockComponent(AdditionalFeedbackComponent),
                MockComponent(RatingComponent),
                MockComponent(ComplaintsStudentViewComponent),
                MockComponent(AlertComponent),
                MockComponent(FaIconComponent),
            ],
            providers: [
                MockProvider(ChangeDetectorRef),
                { provide: TranslateService, useClass: MockTranslateService },
                { provide: ComplaintService, useClass: MockComplaintService },
                { provide: LocalStorageService, useClass: MockSyncStorage },
                { provide: SessionStorageService, useClass: MockSyncStorage },
                { provide: CookieService, useClass: MockCookieService },
                { provide: ActivatedRoute, useValue: route },
                { provide: ParticipationWebsocketService, useClass: MockParticipationWebsocketService },
                { provide: DeviceDetectorService },
            ],
        })
            .overrideModule(ArtemisTestModule, { set: { declarations: [], exports: [] } })
            .compileComponents()
            .then(() => {
                fixture = TestBed.createComponent(ModelingSubmissionComponent);
                comp = fixture.componentInstance;
                debugElement = fixture.debugElement;
                service = debugElement.injector.get(ModelingSubmissionService);
                alertService = debugElement.injector.get(AlertService);
                router = debugElement.injector.get(Router);
                comp.modelingEditor = TestBed.createComponent(MockComponent(ModelingEditorComponent)).componentInstance;
            });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('Should call load getDataForModelingEditor on init', () => {
        // GIVEN
        const getLatestSubmissionForModelingEditorStub = jest.spyOn(service, 'getLatestSubmissionForModelingEditor').mockReturnValue(of(submission));

        // WHEN
        comp.ngOnInit();

        // THEN
        expect(getLatestSubmissionForModelingEditorStub).toHaveBeenCalledTimes(1);
        expect(comp.submission.id).toBe(20);
    });

    it('should allow to submit when exercise due date not set', () => {
        // GIVEN
        jest.spyOn(service, 'getLatestSubmissionForModelingEditor').mockReturnValue(of(submission));

        // WHEN
        comp.isLoading = false;
        fixture.detectChanges();

        expect(debugElement.query(By.css('div'))).not.toBe(null);

        const submitButton = debugElement.query(By.css('jhi-button'));
        expect(submitButton).not.toBe(null);
        expect(submitButton.attributes['ng-reflect-disabled']).toBe('false');
        expect(comp.isActive).toBe(true);
    });

    it('should not allow to submit after the deadline if the initialization date is before the due date', () => {
        submission.participation!.initializationDate = dayjs().subtract(2, 'days');
        (<StudentParticipation>submission.participation).exercise!.dueDate = dayjs().subtract(1, 'days');
        jest.spyOn(service, 'getLatestSubmissionForModelingEditor').mockReturnValue(of(submission));

        fixture.detectChanges();

        const submitButton = debugElement.query(By.css('jhi-button'));
        expect(submitButton).not.toBe(null);
        expect(submitButton.attributes['ng-reflect-disabled']).toBe('true');
    });

    it('should allow to submit after the deadline if the initialization date is after the due date and not submitted', () => {
        submission.participation!.initializationDate = dayjs().add(1, 'days');
        (<StudentParticipation>submission.participation).exercise!.dueDate = dayjs();
        submission.submitted = false;
        jest.spyOn(service, 'getLatestSubmissionForModelingEditor').mockReturnValue(of(submission));

        fixture.detectChanges();

        expect(comp.isLate).toBe(true);
        const submitButton = debugElement.query(By.css('jhi-button'));
        expect(submitButton).not.toBe(null);
        expect(submitButton.attributes['ng-reflect-disabled']).toBe('false');
        submission.submitted = true;
    });

    it('should not allow to submit if there is a result and no due date', () => {
        comp.result = result;
        jest.spyOn(service, 'getLatestSubmissionForModelingEditor').mockReturnValue(of(submission));

        fixture.detectChanges();

        const submitButton = debugElement.query(By.css('jhi-button'));
        expect(submitButton).not.toBe(null);
        expect(submitButton.attributes['ng-reflect-disabled']).toBe('true');
    });

    it('should get inactive as soon as the due date passes the current date', () => {
        (<StudentParticipation>submission.participation).exercise!.dueDate = dayjs().add(1, 'days');
        jest.spyOn(service, 'getLatestSubmissionForModelingEditor').mockReturnValue(of(submission));

        fixture.detectChanges();
        comp.participation.initializationDate = dayjs();

        expect(comp.isActive).toBe(true);

        comp.modelingExercise.dueDate = dayjs().subtract(1, 'days');

        fixture.detectChanges();
        expect(comp.isActive).toBe(false);
    });

    it('should navigate to access denied page on 403 error status', () => {
        jest.spyOn(service, 'getLatestSubmissionForModelingEditor').mockReturnValue(throwError({ status: 403 }));
        const routerStub = jest.spyOn(router, 'navigate').mockReturnValue(new Promise(() => true));
        fixture.detectChanges();
        expect(routerStub).toHaveBeenCalledTimes(1);
    });

    it('should set correct properties on modeling exercise update when saving', () => {
        jest.spyOn(service, 'getLatestSubmissionForModelingEditor').mockReturnValue(of(submission));
        fixture.detectChanges();

        const updateStub = jest.spyOn(service, 'update').mockReturnValue(of(new HttpResponse({ body: submission })));
        comp.saveDiagram();
        expect(updateStub).toHaveBeenCalledTimes(1);
        expect(comp.submission).toEqual(submission);
    });

    it('should set correct properties on modeling exercise create when saving', () => {
        fixture.detectChanges();

        const createStub = jest.spyOn(service, 'create').mockReturnValue(of(new HttpResponse({ body: submission })));
        comp.modelingExercise = new ModelingExercise(UMLDiagramType.DeploymentDiagram, undefined, undefined);
        comp.modelingExercise.id = 1;
        comp.saveDiagram();
        expect(createStub).toHaveBeenCalledTimes(1);
        expect(comp.submission).toEqual(submission);
    });

    it('should set correct properties on modeling exercise create when submitting', () => {
        fixture.detectChanges();

        const modelSubmission = <ModelingSubmission>(<unknown>{ model: '{"elements": [{"id": 1}]}', submitted: true, participation });
        comp.submission = modelSubmission;
        const createStub = jest.spyOn(service, 'create').mockReturnValue(of(new HttpResponse({ body: submission })));
        comp.modelingExercise = new ModelingExercise(UMLDiagramType.DeploymentDiagram, undefined, undefined);
        comp.modelingExercise.id = 1;
        comp.submit();
        expect(createStub).toHaveBeenCalledTimes(1);
        expect(comp.submission).toEqual(submission);
    });

    it('should catch error on submit', () => {
        const modelSubmission = <ModelingSubmission>(<unknown>{ model: '{"elements": [{"id": 1}]}', submitted: true, participation });
        comp.submission = modelSubmission;
        jest.spyOn(service, 'create').mockReturnValue(throwError({ status: 500 }));
        const alertServiceSpy = jest.spyOn(alertService, 'error');
        comp.modelingExercise = new ModelingExercise(UMLDiagramType.DeploymentDiagram, undefined, undefined);
        comp.modelingExercise.id = 1;
        comp.submit();
        expect(alertServiceSpy).toHaveBeenCalledTimes(1);
        expect(comp.submission).toBe(modelSubmission);
    });

    it('should set result when new result comes in from websocket', () => {
        submission.model = '{"elements": [{"id": 1}]}';
        jest.spyOn(service, 'getLatestSubmissionForModelingEditor').mockReturnValue(of(submission));
        const participationWebSocketService = debugElement.injector.get(ParticipationWebsocketService);

        const unreferencedFeedback = new Feedback();
        unreferencedFeedback.id = 1;
        unreferencedFeedback.detailText = 'General Feedback';
        unreferencedFeedback.credits = 5;
        unreferencedFeedback.type = FeedbackType.MANUAL_UNREFERENCED;
        const newResult = new Result();
        newResult.score = 50.0;
        newResult.assessmentType = AssessmentType.MANUAL;
        newResult.submission = submission;
        newResult.participation = submission.participation;
        newResult.completionDate = dayjs();
        newResult.feedbacks = [unreferencedFeedback];
        const subscribeForLatestResultOfParticipationSubject = new BehaviorSubject<Result | undefined>(newResult);
        const subscribeForLatestResultOfParticipationStub = jest
            .spyOn(participationWebSocketService, 'subscribeForLatestResultOfParticipation')
            .mockReturnValue(subscribeForLatestResultOfParticipationSubject);
        fixture.detectChanges();
        expect(subscribeForLatestResultOfParticipationStub).toHaveBeenCalledTimes(1);
        expect(comp.assessmentResult).toEqual(newResult);
    });

    it('should update submission when new submission comes in from websocket', () => {
        submission.submitted = false;
        jest.spyOn(service, 'getLatestSubmissionForModelingEditor').mockReturnValue(of(submission));
        const websocketService = debugElement.injector.get(JhiWebsocketService);
        jest.spyOn(websocketService, 'subscribe');
        const modelSubmission = <ModelingSubmission>(<unknown>{
            id: 1,
            model: '{"elements": [{"id": 1}]}',
            submitted: true,
            participation,
        });
        const receiveStub = jest.spyOn(websocketService, 'receive').mockReturnValue(of(modelSubmission));
        fixture.detectChanges();
        expect(comp.submission).toEqual(modelSubmission);
        expect(receiveStub).toHaveBeenCalledTimes(1);
    });

    it('should set correct properties on modeling exercise update when submitting', () => {
        comp.submission = <ModelingSubmission>(<unknown>{
            id: 1,
            model: '{"elements": [{"id": 1}]}',
            submitted: true,
            participation,
        });
        const updateStub = jest.spyOn(service, 'update').mockReturnValue(of(new HttpResponse({ body: submission })));
        comp.modelingExercise = new ModelingExercise(UMLDiagramType.DeploymentDiagram, undefined, undefined);
        comp.modelingExercise.id = 1;
        fixture.detectChanges();
        comp.submit();
        expect(updateStub).toHaveBeenCalledTimes(1);
        expect(comp.submission).toEqual(submission);
    });

    it('should calculate number of elements from model', () => {
        const elements = [{ id: 1 }, { id: 2 }, { id: 3 }];
        const relationships = [{ id: 4 }, { id: 5 }];
        submission.model = JSON.stringify({ elements, relationships });
        comp.submission = submission;
        fixture.detectChanges();
        expect(comp.calculateNumberOfModelElements()).toBe(elements.length + relationships.length);
    });

    it('should update selected entities with given elements', () => {
        const relationships = ['relationShip1', 'relationShip2'];
        const selection = { elements: ['ownerId1', 'ownerId2'], relationships };
        comp.umlModel = <UMLModel>(<unknown>{
            elements: [<UMLElement>(<unknown>{ owner: 'ownerId1', id: 'elementId1' }), <UMLElement>(<unknown>{ owner: 'ownerId2', id: 'elementId2' })],
        });
        fixture.detectChanges();
        comp.onSelectionChanged(selection);
        expect(comp.selectedRelationships).toEqual(relationships);
        expect(comp.selectedEntities).toEqual(['ownerId1', 'ownerId2', 'elementId1', 'elementId2']);
    });

    it('should shouldBeDisplayed return true if no selectedEntities and selectedRelationships', () => {
        const feedback = <Feedback>(<unknown>{ referenceType: 'Activity', referenceId: '5' });
        comp.selectedEntities = [];
        comp.selectedRelationships = [];
        fixture.detectChanges();
        expect(comp.shouldBeDisplayed(feedback)).toBe(true);
        comp.selectedEntities = ['3'];
        fixture.detectChanges();
        expect(comp.shouldBeDisplayed(feedback)).toBe(false);
    });

    it('should shouldBeDisplayed return true if feedback reference is in selectedEntities or selectedRelationships', () => {
        const id = 'referenceId';
        const feedback = <Feedback>(<unknown>{ referenceType: 'Activity', referenceId: id });
        comp.selectedEntities = [id];
        comp.selectedRelationships = [];
        fixture.detectChanges();
        expect(comp.shouldBeDisplayed(feedback)).toBe(true);
        comp.selectedEntities = [];
        comp.selectedRelationships = [id];
        fixture.detectChanges();
        expect(comp.shouldBeDisplayed(feedback)).toBe(false);
    });

    it('should update submission with current values', () => {
        const model = <UMLModel>(<unknown>{
            elements: [<UMLElement>(<unknown>{ owner: 'ownerId1', id: 'elementId1' }), <UMLElement>(<unknown>{ owner: 'ownerId2', id: 'elementId2' })],
        });
        const currentModelStub = jest.spyOn(comp.modelingEditor, 'getCurrentModel').mockReturnValue(model as UMLModel);
        comp.explanation = 'Explanation Test';
        comp.updateSubmissionWithCurrentValues();
        expect(currentModelStub).toHaveBeenCalledTimes(2);
        expect(comp.hasElements).toBe(true);
        expect(comp.submission).not.toBe(undefined);
        expect(comp.submission.model).toBe(JSON.stringify(model));
        expect(comp.submission.explanationText).toBe('Explanation Test');
    });

    it('should display the feedback text properly', () => {
        const gradingInstruction = {
            id: 1,
            credits: 1,
            gradingScale: 'scale',
            instructionDescription: 'description',
            feedback: 'instruction feedback',
            usageCount: 0,
        } as GradingInstruction;
        const feedback = {
            id: 1,
            text: 'feedback1',
            credits: 1.5,
        } as Feedback;

        let textToBeDisplayed = comp.buildFeedbackTextForReview(feedback);
        expect(textToBeDisplayed).toBe(feedback.text);

        feedback.gradingInstruction = gradingInstruction;
        textToBeDisplayed = comp.buildFeedbackTextForReview(feedback);
        expect(textToBeDisplayed).toEqual(gradingInstruction.feedback + '<br>' + feedback.text);
    });

    it('should deactivate return true when there are unsaved changes', () => {
        const currentModel = <UMLModel>(<unknown>{
            elements: [<UMLElement>(<unknown>{ owner: 'ownerId1', id: 'elementId1' }), <UMLElement>(<unknown>{ owner: 'ownerId2', id: 'elementId2' })],
            version: 'version',
        });
        const unsavedModel = <UMLModel>(<unknown>{
            elements: [<UMLElement>(<unknown>{ owner: 'ownerId1', id: 'elementId1' })],
            version: 'version',
        });

        const currentModelStub = jest.spyOn(comp.modelingEditor, 'getCurrentModel').mockReturnValue(currentModel as UMLModel);
        jest.spyOn(comp.modelingEditor, 'isApollonEditorMounted', 'get').mockReturnValue(true);
        comp.submission = submission;
        comp.submission.model = JSON.stringify(unsavedModel);

        const canDeactivate = comp.canDeactivate();

        expect(currentModelStub).toHaveBeenCalledTimes(1);
        expect(canDeactivate).toBe(false);
    });
});
