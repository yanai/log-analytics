package com.tikal.loganalytics;

import java.util.function.BiConsumer;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.SpringApplicationConfiguration;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import com.tikal.loganalytics.Application;
import com.tikal.loganalytics.service.LogAnalyticService;

@RunWith(SpringJUnit4ClassRunner.class)
@SpringApplicationConfiguration(classes = Application.class)
public class LogAnalyticServiceTests {
	private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(LogAnalyticServiceTests.class);
	final BiConsumer<? super Object, ? super Object> printMap = (date, map) -> logger.debug(date + "=" + map);

	@Autowired
	private LogAnalyticService logAnalyticService;
	
	@Test
	public void testGroupByResponse() {
		logAnalyticService.groupingByHost().forEach(printMap);
	}

	@Test
	public void testGroupByDates() {
		logAnalyticService.groupingByDates().forEach(printMap);
	}
	
	@Test
	public void testGroupByDatesThenHosts() {
		logAnalyticService.groupingByDatesThenHosts().forEach(printMap);
	}
	
	@Test
	public void testGroupByHost() {
		logAnalyticService.groupingByHost().forEach(printMap);
	}

	@Test
	public void testFindAnyOK() {
		logger.debug(String.valueOf(logAnalyticService.isAnyWithResponse(HttpStatus.FOUND.value())));
	}
	

}
