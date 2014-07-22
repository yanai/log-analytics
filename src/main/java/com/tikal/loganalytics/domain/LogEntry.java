package com.tikal.loganalytics.domain;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.fasterxml.jackson.annotation.JsonIgnore;

public class LogEntry {
	private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(LogEntry.class);
	private static final DateTimeFormatter df = DateTimeFormatter.ofPattern("dd/MMM/yyyy:HH:mm:ss Z", Locale.US);
	private static final Pattern pattern = Pattern
			.compile("^(\\S+) (\\S+) (\\S+) \\[([\\w:/]+\\s[+\\-]\\d{4})\\] \"(.+?)\" (\\d{3}) (\\S+)");

	
	private final String host;
	private final LocalDateTime dateTime;
	private final String request;
	private final int response;
	private final int byteSent;

	public LogEntry(final String host, final LocalDateTime dateTime, final String request, final int response,
			final Integer byteSent) {
		this.host = host;
		this.dateTime = dateTime;
		this.request = request;
		this.response = response;
		this.byteSent = byteSent;
	}

	public String getHost() {
		return host;
	}

	@JsonIgnore
	public LocalDateTime getDateTime() {
		return dateTime;
	}

	@JsonIgnore
	public LocalDate getDate() {
		return dateTime.toLocalDate();
	}
	
	public String getDateFormatted() {
		return dateTime.toString();
	}
	

	public String getRequest() {
		return request;
	}

	public int getResponse() {
		return response;
	}

	public int getByteSent() {
		return byteSent;
	}

	@Override
	public String toString() {
		return "LogEntry [host=" + host + ", dateTime=" + dateTime + ", request=" + request + ", response=" + response
				+ ", byteSent=" + byteSent + "]";
	}
	
	public static LogEntry parse(final String line) {
		final Matcher matcher = pattern.matcher(line);
		if (!matcher.matches()){ 
			logger.error("Bad log entry {}",line);
			return null;
		}

		final String byteSent = matcher.group(7);
		return new LogEntry(matcher.group(1), LocalDateTime.parse(matcher.group(4), df), matcher.group(5),
				Integer.parseInt(matcher.group(6)), (!byteSent.equals("-")) ? Integer.parseInt(byteSent) : 0);
	}
}
