/*************************************************************
 * Main code, responsible for configuring the steps and their
 * actions.
 *
 * Author: LITW Team.
 *
 * © Copyright 2017-2024 LabintheWild.
 * For questions about this file and permission to use
 * the code, contact us at tech@labinthewild.org
 *************************************************************/

// load webpack modules
window.$ = window.jQuery = require("jquery");
window.bootstrap = require("bootstrap");
require("jquery-ui-bundle");
var _ = require('lodash');
var introTemplate = require("./templates/introduction.html");
var irbTemplate = require("../templates/irb.html");
var demographicsTemplate = require("./templates/demographics.html");
var question1Template = require("./templates/decision-making.html");
var loadingTemplate = require("../templates/loading.html");
var resultsTemplate = require("./templates/results.html");
var resultsFooter = require("../templates/results-footer.html");
var commentsTemplate = require("../templates/comments.html");
require("../js/litw/jspsych-display-info");
require("../js/litw/jspsych-display-slide");

//TODO: document "params.study_id" when updating the docs/7-ManageData!!!
module.exports = (function(exports) {
	var timeline = [],
	params = {
		questionsAndResponses: {},
		progressBarWidth: -25,
		questionOrderArray: [],
		numQuestions: 0,
		study_id: "fa42e461-c85f-4c23-8280-37054dafdc5d",
		study_recommendation: [],
		preLoad: ["../img/btn-next.png","../img/btn-next-active.png","../img/ajax-loader.gif"],
		slides: {
			INTRODUCTION: {
				name: "introduction",
				type: "display-slide",
				template: introTemplate,
				display_element: $("#intro"),
				display_next_button: false,
			},
			INFORMED_CONSENT: {
				name: "informed_consent",
				type: "display-slide",
				template: irbTemplate,
				display_element: $("#irb"),
				display_next_button: false,
			},
			DEMOGRAPHICS: {
				type: "display-slide",
				template: demographicsTemplate,
				display_element: $("#demographics"),
				name: "demographics",
				finish: function(){
					var dem_data = $('#demographicsForm').alpaca().getValue();
					LITW.data.submitDemographics(dem_data);
				}
			},
			QUESTION1: {
				name: "questionnaire",
				type: "display-slide",
				template: question1Template,
				template_data: getStudyQuestions,
				display_element: $("#question1"),
				display_next_button: false,
			},
			QUESTION2: {
				name: "questionnaire",
				type: "display-slide",
				template: question1Template,
				template_data: getStudyQuestions,
				display_element: $("#question1"),
				display_next_button: false,
			},
			QUESTION3: {
				name: "questionnaire",
				type: "display-slide",
				template: question1Template,
				template_data: getStudyQuestions,
				display_element: $("#question1"),
				display_next_button: false,
			},
			QUESTION4: {
				name: "questionnaire",
				type: "display-slide",
				template: question1Template,
				template_data: getStudyQuestions,
				display_element: $("#question1"),
				display_next_button: false,
			},
			COMMENTS: {
				type: "display-slide",
				template: commentsTemplate,
				display_element: $("#comments"),
				name: "comments",
				finish: function(){
					var comments = $('#commentsForm').alpaca().getValue();
					if (Object.keys(comments).length > 0) {
						LITW.data.submitComments({
							comments: comments
						});
					}
				}
			},
			RESULTS: {
				type: "call-function",
				func: function(){
					calculateResults();
				}
			}
		}
	};

	function configureStudy() {
		params.questionOrderArray = randomizeArray(createArray());
		timeline.push(params.slides.INTRODUCTION);
		//timeline.push(params.slides.INFORMED_CONSENT);
		//timeline.push(params.slides.DEMOGRAPHICS);
		timeline.push(params.slides.QUESTION1);
		timeline.push(params.slides.QUESTION2);
		timeline.push(params.slides.QUESTION3);
		timeline.push(params.slides.QUESTION4);
		timeline.push(params.slides.COMMENTS);
		timeline.push(params.slides.RESULTS);
	}

	function getStudyQuestions() {
		let counter = 1;
		let numQ = 7;
		let numA = 3;
		let quest = {
			questions: [],
			responses: []
		}
		while(counter <= Math.max(numQ, numA)) {
			if (counter <= numQ) {
				quest.questions.push({
					id: params.questionOrderArray[counter - 1],
					text: $.i18n(`study-mann-q${params.questionOrderArray[counter - 1]}`)
				})
			}
			if (counter <= numA) {
				quest.responses.push({
					id: counter,
					text: $.i18n(`study-mann-r${counter}`)
				})
			}
			counter++;
		}
		params.progressBarWidth += 25;
		params.questionOrderArray.splice(0, 7);
		return quest;
	}

	function createArray() {
		let array = [];
		for (let index = 1; index < 29; index++) {
			array.push(index);
		}
		return array;
	}

	function randomizeArray(array) {
		return array.sort(() => (Math.random() > 0.5) ? 1 : -1);
	}

	function calculateResults() {
		let results_data = {};
    let vigilance = 0;
    let hypervigilance = 0;
    let buckpassing = 0;
    let procrastination = 0;
    let dmSelfEsteem = 0;
    for (const key in params.questionsAndResponses) {
    	if (key <= 6) {
      	vigilance += (params.questionsAndResponses[key] - 1);
      } else if (key <= 12) {
				buckpassing += (params.questionsAndResponses[key] - 1);
			} else if (key <= 17) {
				hypervigilance += (params.questionsAndResponses[key] - 1);
			} else if (key <= 22) {
				procrastination += (params.questionsAndResponses[key] - 1);
			} else {
				dmSelfEsteem += (params.questionsAndResponses[key] - 1);
			}
    }
   	results_data = {
			"vigilance": vigilance,
			"hypervigilance": hypervigilance,
			"buckpassing": buckpassing,
			"procrastination": procrastination,
			"selfEsteem": dmSelfEsteem
		}
		LITW.data.submitStudyData({results_data1 : results_data});
		chooseMessage(results_data);
		showResults(results_data, true)
	}

	function chooseMessage(results_data) {
		let num = Math.max(results_data.vigilance, results_data.hypervigilance, results_data.buckpassing, results_data.procrastination);
		if(num == results_data.vigilance) {
			results_data.message = $.i18n('litw-results-intro-v');
		} else if (num == results_data.hypervigilance) {
			results_data.message = $.i18n('litw-results-intro-hv');
		} else if(num == results_data.buckpassing) {
			results_data.message = $.i18n('litw-results-intro-bp');
		} else {
			results_data.message = $.i18n('litw-results-intro-p');
		}
	}

	function showResults(results = {}, showFooter = false) {
		if('PID' in params.URL) {
			//REASON: Default behavior for returning a unique PID when collecting data from other platforms
			results.code = LITW.data.getParticipantId();
		}

		$("#results").html(
			resultsTemplate({
				data: results
			}));
		if(showFooter) {
			$("#results-footer").html(resultsFooter(
				{
					share_url: window.location.href,
					share_title: $.i18n('litw-irb-header'),
					share_text: $.i18n('litw-template-title'),
					more_litw_studies: params.study_recommendation
				}
			));
		}
		$("#results").i18n();
		LITW.utils.showSlide("results");
	}

	function readSummaryData() {
		$.getJSON( "summary.json", function( data ) {
			//TODO: 'data' contains the produced summary form DB data
			//      in case the study was loaded using 'index.php'
			//SAMPLE: The example code gets the cities of study partcipants.
			console.log(data);
		});
	}

	function startStudy() {
		// generate unique participant id and geolocate participant
		LITW.data.initialize();
		// save URL params
		params.URL = LITW.utils.getParamsURL();
		if( Object.keys(params.URL).length > 0 ) {
			LITW.data.submitData(params.URL,'litw:paramsURL');
		}
		// populate study recommendation
		LITW.engage.getStudiesRecommendation(2, (studies_list) => {
			params.study_recommendation = studies_list;
		});
		// initiate pages timeline
		jsPsych.init({
		  timeline: timeline
		});
	}

	function startExperiment(){
		//TODO These methods should be something like act1().then.act2().then...
		//... it is close enough to that... maybe the translation need to be encapsulated next.
		// get initial data from database (maybe needed for the results page!?)
		//readSummaryData();

		// determine and set the study language
		$.i18n().locale = LITW.locale.getLocale();
		var languages = {
			'en': './i18n/en.json?v=1.0',
			'pt': './i18n/pt-br.json?v=1.0',
		};
		//TODO needs to be a little smarter than this when serving specific language versions, like pt-BR!
		var language = LITW.locale.getLocale().substring(0,2);
		var toLoad = {};
		if(language in languages) {
			toLoad[language] = languages[language];
		} else {
			toLoad['en'] = languages['en'];
		}
		$.i18n().load(toLoad).done(
			function() {
				$('head').i18n();
				$('body').i18n();

				LITW.utils.showSlide("img-loading");
				//start the study when resources are preloaded
				jsPsych.pluginAPI.preloadImages(params.preLoad,
					function () {
						configureStudy();
						startStudy();
					},

					// update loading indicator
					function (numLoaded) {
						$("#img-loading").html(loadingTemplate({
							msg: $.i18n("litw-template-loading"),
							numLoaded: numLoaded,
							total: params.preLoad.length
						}));
					}
				);
			});
	}



	// when the page is loaded, start the study!
	$(document).ready(function() {
		startExperiment();
	});
	exports.study = {};
	exports.study.params = params

})( window.LITW = window.LITW || {} );


