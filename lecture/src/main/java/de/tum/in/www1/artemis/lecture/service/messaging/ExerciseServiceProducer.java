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
import java.util.Set;

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

    public Set<Exercise> getLectureExercises(Set<Exercise> exercises, User user) throws JMSException {
        UserExerciseDTO userExerciseDTO = new UserExerciseDTO(exercises, user);
        LOGGER.info("Send data {}", userExerciseDTO);
        jmsTemplate.convertAndSend(LECTURE_QUEUE_GET_EXERCISES, userExerciseDTO);
        Message responseMessage = jmsTemplate.receive(LECTURE_QUEUE_GET_EXERCISES_RESPONSE);
        return readData(responseMessage.getBody(String.class));
    }

    private Set<Exercise> readData(String value) {
        ObjectMapper objectMapper = new ObjectMapper();
        Set<Exercise> exercises = null;
        try {
            exercises = objectMapper.readValue(value, new TypeReference<Set<Exercise>>(){});
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }
        return exercises;
    }
}
