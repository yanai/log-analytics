package com.tikal.loganalytics.service;

import static java.util.Comparator.comparing;
import static java.util.stream.Collectors.counting;
import static java.util.stream.Collectors.groupingBy;
import static java.util.stream.Collectors.toList;

import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.function.Predicate;
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
					.map(LogEntry::parse);
		} catch (final Exception e) {
			throw new RuntimeException(e);
		}
	}

	
	private Stream<String> lines(final Path path) {
		try {
			return Files.lines(path, charset);
		} catch (final IOException e) {
			throw new RuntimeException(e);
		}
	}
	
////////////////////////LISTS/////////////////////////////////
	@RequestMapping("/errors")
	public List<LogEntry> findErrorLogs() {
		return streamLogs()
			.filter((le) -> le.getResponse() >= 500)
			.sorted(comparing(LogEntry::getDateTime).reversed())
			.limit(5)
			.collect(toList());
	}
	

	//////////////////////////ANY RESULTS//////////////////////////////////////////
	
	private boolean anyMatch(final Predicate<? super LogEntry> predicate) {
		return streamLogs().anyMatch(predicate);
	}

	@RequestMapping("/any/{response}")
	public boolean isAnyResponse(@PathVariable("response") final int response) {
		return anyMatch((le) -> le.getResponse() == response);
	}

	@RequestMapping("/any/empty-body")
	public boolean isAnyEmptyResponse() {
		return anyMatch((le) -> le.getByteSent() == 0);
	}
			

	

	//////////////////////GROUPING/////////////////////////////////
	@RequestMapping("/grouping/datesThenResponse")
	public Map<LocalDate, Map<Integer, Long>> groupingByDatesThenResponse() {
		return streamLogs()
				.collect(
						groupingBy(LogEntry::getDate,TreeMap::new, 
								groupingBy(LogEntry::getResponse, counting())));
	}

	

	

}
