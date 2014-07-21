package com.tikal.loganalytics;

import java.util.List;
import java.util.function.BiConsumer;
import java.util.stream.IntStream;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.SpringApplicationConfiguration;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import com.tikal.loganalytics.Application;
import com.tikal.loganalytics.domain.LogEntry;
import com.tikal.loganalytics.service.LogAnalyticService;

@RunWith(SpringJUnit4ClassRunner.class)
@SpringApplicationConfiguration(classes = Application.class)
public class LogAnalyticServiceTests {
	private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(LogAnalyticServiceTests.class);
	final BiConsumer<? super Object, ? super Object> printMap = (date, map) -> logger.debug(date + "=" + map);

	@Autowired
	private LogAnalyticService logAnalyticService;

	@Test
	public void testFindAnyOK() {
		logger.debug(String.valueOf(logAnalyticService.isAnyResponse(HttpStatus.FOUND.value())));
	}
	
	
	@Test
	public void testFindErrorLogs() {
		final List<LogEntry> errLogs = logAnalyticService.findErrorLogs();
		errLogs.forEach(le->logger.debug(le.toString()));
	}
	

}
