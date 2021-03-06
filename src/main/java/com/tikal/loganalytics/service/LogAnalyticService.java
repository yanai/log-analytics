package com.tikal.loganalytics.service;

import static java.util.Comparator.comparing;
import static java.util.stream.Collectors.counting;
import static java.util.stream.Collectors.groupingBy;
import static java.util.stream.Collectors.summarizingInt;
import static java.util.stream.Collectors.toList;

import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.IntSummaryStatistics;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Stream;

import javax.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tikal.loganalytics.domain.LogEntry;

@RequestMapping("/logs")
@RestController
public class LogAnalyticService {
	private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(LogAnalyticService.class);
	private static final String LOG_EXT = "log";


	@Value("${app.logging.file.dir}")
	private String loggingDir;

	@Value("${app.logging.file.charset:latin1}")
	private String charsetName;
	
	private Charset charset;
	
	@PostConstruct
	private void init(){
		charset = Charset.forName(charsetName);
	}
	
	///////////////////////STREAMING///////////////////////////////
	private Stream<LogEntry> streamLogs() {
		try {
			return Files.list(Paths.get(loggingDir))
					.filter(p -> p.toString().endsWith(LOG_EXT))
					.flatMap(this::lines)
					.map(LogEntry::parse)
					.filter(le->le!=null);
		} catch (final Exception e) {
			throw new RuntimeException(e);
		}
	}

	
	private Stream<String> lines(final Path path) {
		try {
			return Files.lines(path, charset);
		} catch (final IOException e) {
			logger.error("Failed to process "+path,e);
			return Stream.empty();
		}
	}
	
////////////////////////LISTS/////////////////////////////////
	
	
	//http://localhost:8080/logs/errors
	@RequestMapping("/errors")
	public List<LogEntry> findErrorLogs() {
		return streamLogs()
			.filter((le) -> le.getResponse() >= 500)
			.sorted(comparing(LogEntry::getDateTime).reversed())
			.limit(5)
			.collect(toList());
	}
	

	//////////////////////////ANY RESULTS//////////////////////////////////////////
	

	//http://localhost:8080/logs/any/500
	@RequestMapping("/any/{response}")
	public boolean isAnyResponse(@PathVariable("response") final int response) {
		return streamLogs().anyMatch((le) -> le.getResponse() == response);
	}

	//http://localhost:8080/logs/any/empty-body
	@RequestMapping("/any/empty-body")
	public boolean isAnyEmptyResponse() {
		return streamLogs().anyMatch((le) -> le.getByteSent() == 0);
	}
	
	//http://localhost:8080/logs/heaviest
	@RequestMapping("/heaviest")
	public LogEntry findHeaviestEntryLog() {
		return streamLogs().max(comparing(LogEntry::getByteSent)).orElse(null);
	}
	
	

	//////////////////////GROUPING/////////////////////////////////
	
	//http://localhost:8080/logs/grouping/responsesPerDay
	@RequestMapping("/grouping/responsesPerDay")
	public Map<LocalDate, Map<Integer, Long>> groupingByResponsesPerDay() {
		return streamLogs()
				.collect(
						groupingBy(	LogEntry::getDate,
									TreeMap::new, 
									groupingBy(LogEntry::getResponse, counting())));
	}
	
	
	//http://localhost:8080/logs/grouping/bytesPerDay
	@RequestMapping("/grouping/bytesPerDay")
	public Map<LocalDate, IntSummaryStatistics> bytesSummaryPerDay() {
		return streamLogs()
				.collect(
						groupingBy(	LogEntry::getDate,
									TreeMap::new, 
									summarizingInt(LogEntry::getByteSent)));
	}

	

	

}
