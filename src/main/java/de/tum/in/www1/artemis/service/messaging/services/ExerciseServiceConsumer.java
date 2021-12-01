package de.tum.in.www1.artemis.service.messaging.services;

import java.util.Set;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jms.annotation.EnableJms;
import org.springframework.jms.annotation.JmsListener;
import org.springframework.messaging.Message;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import de.tum.in.www1.artemis.domain.Exercise;
import de.tum.in.www1.artemis.service.ExerciseService;
import de.tum.in.www1.artemis.service.dto.UserExerciseDTO;

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

    @JmsListener(destination = LECTURE_QUEUE_GET_EXERCISES)
    public void getExercisesAndRespond(Message message) {
        LOGGER.info("Receive data {}", message.getPayload());
        UserExerciseDTO data = readData(message.getPayload().toString());
        Set<Exercise> exercisesUserIsAllowedToSee = exerciseService.filterOutExercisesThatUserShouldNotSee(data.getExercises(), data.getUser());
        Set<Exercise> exercisesWithAllInformationNeeded = exerciseService
                .loadExercisesWithInformationForDashboard(exercisesUserIsAllowedToSee.stream().map(Exercise::getId).collect(Collectors.toSet()), data.getUser());
        exerciseServiceResponseProducer.sendLectureExercisesResponse(exercisesWithAllInformationNeeded);
    }

    private UserExerciseDTO readData(String value) {
        ObjectMapper objectMapper = new ObjectMapper();
        UserExerciseDTO userExerciseDTO = null;
        try {
            userExerciseDTO = objectMapper.readValue(value, UserExerciseDTO.class);
        }
        catch (JsonProcessingException e) {
            e.printStackTrace();
        }
        return userExerciseDTO;
    }
}
