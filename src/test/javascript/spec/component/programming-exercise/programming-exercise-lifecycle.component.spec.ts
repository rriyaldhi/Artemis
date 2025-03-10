import dayjs from 'dayjs/esm';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ArtemisTestModule } from '../../test.module';
import { MockComponent, MockDirective } from 'ng-mocks';
import { ProgrammingExerciseLifecycleComponent } from 'app/exercises/programming/shared/lifecycle/programming-exercise-lifecycle.component';
import { HelpIconComponent } from 'app/shared/components/help-icon.component';
import { ProgrammingExercise } from 'app/entities/programming-exercise.model';
import { ProgrammingExerciseTestScheduleDatePickerComponent } from 'app/exercises/programming/shared/lifecycle/programming-exercise-test-schedule-date-picker.component';
import { NgModel } from '@angular/forms';
import { TranslatePipeMock } from '../../helpers/mocks/service/mock-translate.service';
import { AssessmentType } from 'app/entities/assessment-type.model';
import { SimpleChange } from '@angular/core';
import { IncludedInOverallScore } from 'app/entities/exercise.model';

describe('ProgrammingExerciseLifecycleComponent', () => {
    let comp: ProgrammingExerciseLifecycleComponent;
    let fixture: ComponentFixture<ProgrammingExerciseLifecycleComponent>;

    const nextDueDate = dayjs().add(5, 'days');
    const afterDueDate = dayjs().add(7, 'days');
    const exampleSolutionPublicationDate = dayjs().add(9, 'days');
    let exercise: ProgrammingExercise;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ArtemisTestModule],
            declarations: [
                ProgrammingExerciseLifecycleComponent,
                MockComponent(ProgrammingExerciseTestScheduleDatePickerComponent),
                MockComponent(HelpIconComponent),
                MockDirective(NgModel),
                TranslatePipeMock,
            ],
        })
            .compileComponents()
            .then(() => {
                fixture = TestBed.createComponent(ProgrammingExerciseLifecycleComponent);
                comp = fixture.componentInstance;

                exercise = {
                    id: 42,
                    dueDate: nextDueDate,
                    buildAndTestStudentSubmissionsAfterDueDate: afterDueDate,
                    exampleSolutionPublicationDate,
                } as ProgrammingExercise;
            });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should do nothing if the release date is set to null', () => {
        comp.exercise = exercise;
        comp.updateReleaseDate(undefined);

        expect(comp.exercise.dueDate).toEqual(nextDueDate);
        expect(comp.exercise.buildAndTestStudentSubmissionsAfterDueDate).toEqual(afterDueDate);
        expect(comp.exercise.exampleSolutionPublicationDate).toEqual(exampleSolutionPublicationDate);
    });

    it('should only reset the due date if the release date is between the due date and the after due date', () => {
        comp.exercise = exercise;
        const newRelease = dayjs().add(6, 'days');
        comp.updateReleaseDate(newRelease);

        expect(comp.exercise.dueDate).toEqual(newRelease);
        expect(comp.exercise.buildAndTestStudentSubmissionsAfterDueDate).toEqual(afterDueDate);
        expect(comp.exercise.exampleSolutionPublicationDate).toEqual(exampleSolutionPublicationDate);
    });

    it('should reset the due date, the after due date and the example solution publication date if the new release is after all dates', () => {
        comp.exercise = exercise;
        const newRelease = dayjs().add(10, 'days');
        comp.updateReleaseDate(newRelease);

        expect(comp.exercise.releaseDate).toEqual(newRelease);
        expect(comp.exercise.dueDate).toEqual(newRelease);
        expect(comp.exercise.buildAndTestStudentSubmissionsAfterDueDate).toEqual(newRelease);
        expect(comp.exercise.exampleSolutionPublicationDate).toEqual(newRelease);
    });

    it('should reset the example solution publication date if the new due date is later', () => {
        const newDueDate = dayjs().add(10, 'days');
        comp.exercise = exercise;
        exercise.dueDate = newDueDate;
        comp.updateExampleSolutionPublicationDate(newDueDate);

        expect(comp.exercise.exampleSolutionPublicationDate).toEqual(newDueDate);
    });

    it('should change the value for allowing complaints for exercise with automatic assessment after toggling', () => {
        comp.exercise = exercise;
        comp.exercise.allowComplaintsForAutomaticAssessments = false;
        comp.exercise.assessmentType = AssessmentType.AUTOMATIC;
        comp.toggleComplaintsType();

        expect(comp.exercise.allowComplaintsForAutomaticAssessments).toBeTrue();
    });

    it('should change assessment type from automatic to semi-automatic after toggling', () => {
        comp.exercise = exercise;
        comp.exercise.assessmentType = AssessmentType.AUTOMATIC;
        comp.toggleAssessmentType();

        expect(comp.exercise.assessmentType).toBe(AssessmentType.SEMI_AUTOMATIC);
        expect(comp.exercise.allowComplaintsForAutomaticAssessments).toBeFalse();
    });

    it('should change assessment type from semi-automatic to automatic after toggling', () => {
        comp.exercise = exercise;
        comp.exercise.assessmentType = AssessmentType.SEMI_AUTOMATIC;
        comp.toggleAssessmentType();

        expect(comp.exercise.assessmentType).toBe(AssessmentType.AUTOMATIC);
        expect(comp.exercise.assessmentDueDate).toBeUndefined();
    });

    it('should not cascade date changes when updateReleaseDate is called when readOnly is true', () => {
        comp.exercise = exercise;
        const oldRelease = dayjs().add(10, 'days');
        comp.updateReleaseDate(oldRelease);

        expect(comp.exercise.releaseDate).toEqual(oldRelease);
        expect(comp.exercise.dueDate).toEqual(oldRelease);
        expect(comp.exercise.exampleSolutionPublicationDate).toEqual(oldRelease);

        comp.readOnly = true;

        const newRelease = dayjs().add(20, 'days');
        comp.updateReleaseDate(newRelease);

        expect(comp.exercise.releaseDate).toEqual(newRelease);
        expect(comp.exercise.dueDate).toEqual(oldRelease);
        expect(comp.exercise.exampleSolutionPublicationDate).toEqual(oldRelease);
    });

    it('should not cascade date changes when updateExampleSolutionPublicationDate is called when readOnly is true', () => {
        const oldDueDate = dayjs().add(10, 'days');
        comp.exercise = exercise;
        exercise.dueDate = oldDueDate;
        comp.updateExampleSolutionPublicationDate(oldDueDate);

        expect(comp.exercise.exampleSolutionPublicationDate).toEqual(oldDueDate);

        comp.readOnly = true;

        const newDueDate = dayjs().add(20, 'days');
        exercise.dueDate = newDueDate;
        comp.updateExampleSolutionPublicationDate(newDueDate);

        expect(comp.exercise.exampleSolutionPublicationDate).toEqual(oldDueDate);
    });

    it('should alert correct date when exampleSolutionPublicationDate is updated automatically', () => {
        const alertSpy = jest.spyOn(window, 'alert');

        const now = dayjs();
        exercise.dueDate = now.add(10, 'days');
        exercise.releaseDate = now.add(20, 'days');
        comp.exercise = exercise;

        comp.updateExampleSolutionPublicationDate(exercise.releaseDate);

        expect(comp.exercise.exampleSolutionPublicationDate).toEqual(exercise.releaseDate);
        expect(alertSpy).toHaveBeenCalledOnce();
        expect(alertSpy).toHaveBeenLastCalledWith('artemisApp.programmingExercise.timeline.alertNewExampleSolutionPublicationDateAsReleaseDate');

        exercise.dueDate = now.add(40, 'days');
        exercise.releaseDate = now.add(30, 'days');
        comp.updateExampleSolutionPublicationDate(exercise.dueDate);

        expect(comp.exercise.exampleSolutionPublicationDate).toEqual(exercise.dueDate);
        expect(alertSpy).toHaveBeenCalledTimes(2);
        expect(alertSpy).toHaveBeenLastCalledWith('artemisApp.programmingExercise.timeline.alertNewExampleSolutionPublicationDateAsDueDate');
    });

    it('should alert each distinct string only once', () => {
        const alertSpy = jest.spyOn(window, 'alert');

        const newExercise = { ...exercise, includedInOverallScore: IncludedInOverallScore.INCLUDED_COMPLETELY };

        const now = dayjs();
        newExercise.dueDate = now.add(10, 'days');
        newExercise.releaseDate = now.add(20, 'days');
        comp.exercise = newExercise;

        comp.ngOnChanges({ exercise: { currentValue: newExercise } as SimpleChange });

        expect(alertSpy).toHaveBeenCalledTimes(3);
        let nthCall = 0;
        expect(alertSpy).toHaveBeenNthCalledWith(++nthCall, 'artemisApp.programmingExercise.timeline.alertNewDueDate');
        expect(alertSpy).toHaveBeenNthCalledWith(++nthCall, 'artemisApp.programmingExercise.timeline.alertNewAfterDueDate');
        expect(alertSpy).toHaveBeenNthCalledWith(++nthCall, 'artemisApp.programmingExercise.timeline.alertNewExampleSolutionPublicationDateAsDueDate');

        const newerExercise = { ...newExercise };
        newerExercise.dueDate = now.add(40, 'days');
        comp.exercise = newerExercise;
        comp.ngOnChanges({ exercise: { currentValue: newerExercise } as SimpleChange });

        expect(alertSpy).toHaveBeenCalledTimes(nthCall + 1);
        expect(alertSpy).toHaveBeenNthCalledWith(++nthCall, 'artemisApp.programmingExercise.timeline.alertNewExampleSolutionPublicationDateAsDueDate');
    });
});
