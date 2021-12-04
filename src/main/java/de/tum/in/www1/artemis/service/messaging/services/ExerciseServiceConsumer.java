package de.tum.in.www1.artemis.service.messaging.services;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jms.annotation.EnableJms;
import org.springframework.jms.annotation.JmsListener;
import org.springframework.stereotype.Component;

import de.tum.in.www1.artemis.domain.Exercise;
import de.tum.in.www1.artemis.security.SecurityUtils;
import de.tum.in.www1.artemis.service.ExerciseService;
import de.tum.in.www1.artemis.service.dto.UserExerciseDTO;

/**
 * Message consumer to receive and process messages related to the exercise service.
 */
@Component
@EnableJms
public class ExerciseServiceConsumer {

    private static final Logger LOGGER = LoggerFactory.getLogger(ExerciseServiceConsumer.class);

    private static final String LECTURE_QUEUE_GET_EXERCISES = "lecture_queue.get_lecture_exercises";

    private ExerciseServiceResponseProducer exerciseServiceResponseProducer;

    private ExerciseService exerciseService;

    public ExerciseServiceConsumer(ExerciseServiceResponseProducer exerciseServiceResponseProducer, ExerciseService exerciseService) {
        this.exerciseServiceResponseProducer = exerciseServiceResponseProducer;
        this.exerciseService = exerciseService;
    }

    /**
     * Consume the message, filter the exercises and send response message
     *
     * @param data the message data
     */
    @JmsListener(destination = LECTURE_QUEUE_GET_EXERCISES)
    public void getExercisesAndRespond(UserExerciseDTO data) {
        LOGGER.info("Received message in queue {} with body {}", LECTURE_QUEUE_GET_EXERCISES, data);
        SecurityUtils.setAuthorizationObject();
        Set<Exercise> exercisesUserIsAllowedToSee = exerciseService.filterOutExercisesThatUserShouldNotSee(new HashSet<>(data.getExercises()), data.getUser());
        Set<Exercise> exercisesWithAllInformationNeeded = exerciseService
                .loadExercisesWithInformationForDashboard(exercisesUserIsAllowedToSee.stream().map(Exercise::getId).collect(Collectors.toSet()), data.getUser());
        exerciseServiceResponseProducer.sendLectureExercisesResponse(exercisesWithAllInformationNeeded);
    }
}
