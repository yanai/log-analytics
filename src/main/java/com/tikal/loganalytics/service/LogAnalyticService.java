package com.tikal.loganalytics.service;

import static java.util.stream.Collectors.counting;
import static java.util.stream.Collectors.groupingBy;

import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.Map;
import java.util.TreeMap;
import java.util.function.Predicate;
import java.util.stream.Stream;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tikal.loganalytics.domain.LogEntry;

@RequestMapping("/logs")
@RestController
public class LogAnalyticService {
	private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(LogAnalyticService.class);

	@Value("${app.logging.file.dir}")
	private String loggingDir;

	@Value("${app.logging.file.charset:latin1}")
	private String charset;

	@RequestMapping("/grouping/hosts")
	public Map<String, Long> groupingByHost() {
		return streamLogs().collect(groupingBy(LogEntry::getHost, counting()));
	}

	@RequestMapping("/grouping/responses")
	public Map<Integer, Long> groupingByResponse() {
		return streamLogs().collect(groupingBy(LogEntry::getResponse, counting()));
	}

	@RequestMapping("/grouping/dates")
	public Map<LocalDate, Long> groupingByDates() {
		return streamLogs().collect(groupingBy(LogEntry::getDate, TreeMap::new,counting()));
	}

	@RequestMapping("/grouping/datesThenHost")
	public Map<LocalDate, Map<String, Long>> groupingByDatesThenHosts() {
		return streamLogs().collect(groupingBy(LogEntry::getDate, TreeMap::new,groupingBy(LogEntry::getHost, counting())));
	}

	@RequestMapping("/grouping/datesThenResponse")
	public Map<LocalDate, Map<Integer, Long>> groupingByDatesThenResponse() {
		return streamLogs().collect(groupingBy(LogEntry::getDate,TreeMap::new, groupingBy(LogEntry::getResponse, counting())));
	}

	// SHORT CIRCUIT EXAMPLE
	@RequestMapping("/any/{response}")
	public boolean isAnyWithResponse(@PathVariable("response") final int response) {
		return anyMatch((le) -> le.getResponse() >= response);
	}

	@RequestMapping("/any/empty-body")
	public boolean isAnyEmptyResponse() {
		return anyMatch((le) -> le.getByteSent() == 0);
	}

	private boolean anyMatch(final Predicate<? super LogEntry> predicate) {
		return streamLogs().anyMatch(predicate);
	}

	private Stream<LogEntry> streamLogs() {
		try {
			return Files.list(Paths.get(loggingDir))
					.filter(p -> p.toString()
					.endsWith("log"))
					.flatMap(this::lines)
					.map(LogEntry::parse);
		} catch (final Exception e) {
			throw new RuntimeException(e);
		}
	}

	private Stream<String> lines(final Path path) {
		try {
			return Files.lines(path, Charset.forName(charset));
		} catch (final IOException e) {
			throw new RuntimeException(e);
		}
	}

}
