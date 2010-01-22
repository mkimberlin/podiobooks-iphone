package com.podiobooks.iphone.service;

import com.podiobooks.iphone.BookList;

public interface StatisticsService {
    public BookList getTodaysTopSubscriptions();

    public BookList getTopTen();
    
    public BookList getTopOverall();
    
    public BookList getTopByVotes();
    
    public BookList getTopAllTimeSubscriptions();
}
