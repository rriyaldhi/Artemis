package de.tum.in.www1.artemis.lecture.service.messaging;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import de.tum.in.www1.artemis.domain.Exercise;
import de.tum.in.www1.artemis.domain.User;
import de.tum.in.www1.artemis.service.dto.UserExerciseDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jms.annotation.EnableJms;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.stereotype.Component;

import javax.jms.JMSException;
import javax.jms.Message;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Message broker producer to send messages related to the exercise service
 */
@Component
@EnableJms
public class ExerciseServiceProducer {
    private static final Logger LOGGER = LoggerFactory.getLogger(ExerciseServiceProducer.class);

    private static final String LECTURE_QUEUE_GET_EXERCISES = "lecture_queue.get_lecture_exercises";
    private static final String LECTURE_QUEUE_GET_EXERCISES_RESPONSE = "lecture_queue.get_lecture_exercises_response";

    @Autowired
    private final JmsTemplate jmsTemplate;

    public ExerciseServiceProducer(JmsTemplate jmsTemplate) {
        this.jmsTemplate = jmsTemplate;
    }

    /**
     * Send a message to Artemis get lecture exercises accessible for the given user and wait for response
     *
     * @param exercises the exercises
     * @param user the user
     * @return the response from Artemis including set of exercises
     * @throws JMSException
     */
    public Set<Exercise> getLectureExercises(Set<Exercise> exercises, User user) throws JMSException {
        UserExerciseDTO userExerciseDTO = new UserExerciseDTO(exercises, user);
        LOGGER.info("Send message in queue {} with body {}", LECTURE_QUEUE_GET_EXERCISES, userExerciseDTO);
        jmsTemplate.convertAndSend(LECTURE_QUEUE_GET_EXERCISES, userExerciseDTO);
        Message responseMessage = jmsTemplate.receive(LECTURE_QUEUE_GET_EXERCISES_RESPONSE);
        LOGGER.info("Received response in queue {} with body {}", LECTURE_QUEUE_GET_EXERCISES_RESPONSE, userExerciseDTO);
        return responseMessage.getBody(Set.class);
    }
}
