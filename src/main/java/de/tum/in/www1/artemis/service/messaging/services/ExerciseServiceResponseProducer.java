package de.tum.in.www1.artemis.service.messaging.services;

import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jms.annotation.EnableJms;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.stereotype.Component;

import de.tum.in.www1.artemis.domain.Exercise;

@Component
@EnableJms
public class ExerciseServiceResponseProducer {

    private static final Logger LOGGER = LoggerFactory.getLogger(ExerciseServiceResponseProducer.class);

    private static final String LECTURE_QUEUE_GET_EXERCISES_RESPONSE = "lecture_queue.get_lecture_exercises_response";

    @Autowired
    private final JmsTemplate jmsTemplate;

    public ExerciseServiceResponseProducer(JmsTemplate jmsTemplate) {
        this.jmsTemplate = jmsTemplate;
    }

    public void sendLectureExercisesResponse(Set<Exercise> exercises) {
        LOGGER.info("Send response data {}", exercises);
        jmsTemplate.convertAndSend(LECTURE_QUEUE_GET_EXERCISES_RESPONSE, exercises);
    }
}
