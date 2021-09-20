import allSuccessful from '../fixtures/programming_exercise_submissions/all_successful/submission.json';
import partiallySuccessful from '../fixtures/programming_exercise_submissions/partially_successful/submission.json';
import { artemis } from '../support/ArtemisTesting';
import { makeSubmissionAndVerifyResults, startParticipationInProgrammingExercise } from '../support/pageobjects/exercises/programming/OnlineEditorPage';

// The user management object
const users = artemis.users;

// Requests
const courseManagement = artemis.requests.courseManagement;

// PageObjects
const editorPage = artemis.pageobjects.programmingExercise.editor;

describe('Programming exercise participations', () => {
    let course: any;
    let exercise: any;

    before(() => {
        setupCourseAndProgrammingExercise();
    });

    it('Makes a failing submission', () => {
        startParticipationInProgrammingExercise(course.title, exercise.title, users.getStudentOne());
        makeFailingSubmission();
    });

    it('Makes a partially successful submission by typing', () => {
        startParticipationInProgrammingExercise(course.title, exercise.title, users.getStudentTwo());
        makePartiallySuccessfulSubmission();
    });

    it('Makes a successful submission', () => {
        startParticipationInProgrammingExercise(course.title, exercise.title, users.getStudentThree());
        makeSuccessfulSubmission();
    });

    after(() => {
        if (!!course) {
            cy.login(users.getAdmin());
            courseManagement.deleteCourse(course.id);
        }
    });

    /**
     * Creates a course and a programming exercise inside that course.
     */
    function setupCourseAndProgrammingExercise() {
        cy.login(users.getAdmin(), '/');
        courseManagement.createCourse().then((response) => {
            course = response.body;
            courseManagement.addStudentToCourse(course.id, users.getStudentOne().username);
            courseManagement.addStudentToCourse(course.id, users.getStudentTwo().username);
            courseManagement.addStudentToCourse(course.id, users.getStudentThree().username);
            courseManagement.createProgrammingExercise({ course }).then((exerciseResponse) => {
                exercise = exerciseResponse.body;
            });
        });
    }

    /**
     * Makes a submission, which fails the CI build and asserts that this is highlighted in the UI.
     */
    function makeFailingSubmission() {
        const submission = { files: [{ name: 'BubbleSort.java', path: 'programming_exercise_submissions/build_error/BubbleSort.txt' }] };
        makeSubmissionAndVerifyResults(editorPage, exercise.packageName, submission, () => {
            editorPage.getResultPanel().contains('Build Failed').should('be.visible');
            editorPage.getResultPanel().contains('0%').should('be.visible');
            editorPage.getBuildOutput().contains('[ERROR] COMPILATION ERROR').should('be.visible');
            editorPage.getInstructionSymbols().each(($el) => {
                cy.wrap($el).find('[data-icon="question"]').should('be.visible');
            });
        });
    }

    /**
     * Makes a submission, which passes and fails some tests, and asserts the outcome in the UI.
     * In this test we actually type the solution to make sure that a real user can type into the editor and we also test file deletion and creation.
     * The other tests directly pass in the final text to save time.
     */
    function makePartiallySuccessfulSubmission() {
        const placeHolder = 'placeholderFile';
        // We create an empty file so that the file browser does not create an extra subfolder when all files are deleted
        editorPage.createFileInRootPackage(placeHolder);
        // We delete all existing files, so we can create new files and don't have to delete their already existing content
        editorPage.deleteFile('Client.java');
        editorPage.deleteFile('BubbleSort.java');
        editorPage.deleteFile('MergeSort.java');
        editorPage.typeSubmission(partiallySuccessful, exercise.packageName);
        editorPage.submit();
        editorPage.getResultPanel().contains('46%').should('be.visible');
        editorPage.getResultPanel().contains('6 of 13 passed').should('be.visible');
        editorPage.getBuildOutput().contains('No build results available').should('be.visible');
        editorPage.getInstructionSymbols().each(($el, $index) => {
            if ($index < 3) {
                cy.wrap($el).find('[data-icon="check"]').should('be.visible');
            } else {
                cy.wrap($el).find('[data-icon="times"]').should('be.visible');
            }
        });
    }

    /**
     * Makes a submission, which passes all tests, and asserts the outcome in the UI.
     */
    function makeSuccessfulSubmission() {
        makeSubmissionAndVerifyResults(editorPage, exercise.packageName, allSuccessful, () => {
            editorPage.getResultPanel().contains('100%').should('be.visible');
            editorPage.getResultPanel().contains('13 of 13 passed').should('be.visible');
            editorPage.getBuildOutput().contains('No build results available').should('be.visible');
            editorPage.getInstructionSymbols().each(($el) => {
                cy.wrap($el).find('[data-icon="check"]').should('be.visible');
            });
        });
    }
});
