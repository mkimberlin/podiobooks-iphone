package com.podiobooks.iphone;

import lombok.Data;

@Data
public class Episode {
    private String title;
    private String description;
    private String publicationDate;
    private int duration = 0;
    private int position = 0;
    private boolean complete = false;
    private String url;
}
