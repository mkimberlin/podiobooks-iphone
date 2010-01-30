package com.podiobooks.iphone;

import lombok.Data;

@Data
public class Episode {
    private String title;
    private String description;
    private String publicationDate;
    private String duration;
    private String url;
}
