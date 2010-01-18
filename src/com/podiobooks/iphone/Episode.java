package com.podiobooks.iphone;

import java.util.Date;

import lombok.Data;

@Data
public class Episode {
    private String title;
    private String description;
    private Date publicationDate;
    private String duration;
    private String url;
}
