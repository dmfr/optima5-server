Ext.Loader.setConfig({
	enabled: true,
	disableCaching: true,
	paths: {
		'Ext': './extjs/src', 
		'Ext.ux' : './js/ux',
		'Ext.calendar' : './js/ext/calendar',
		'Sch' : './js/sch',
		'Optima5' : './js/app'
		}
});
Ext.require('Ext.*') ;
Ext.require('Optima5.App');
Ext.require('Optima5.Modules.All');

var op5desktop, op5session ;
Ext.onReady(function () {
	/*
	Load record for multi-select COMBO
	http://www.sencha.com/forum/archive/index.php/t-202456.html?s=ef437a00595a4b216c80d979879ef5fc
	http://stackoverflow.com/questions/6299164/using-ext-form-basic-loadrecord-to-load-data-into-combo-box-fields-with-remote-s
	
	
	Import CheckValueOnChange from 5.1.4
	https://www.sencha.com/forum/showthread.php?291421
	https://www.sencha.com/forum/showthread.php?292816-Combo-auto-reset-while-typing-with-query-and-forceSelection
	*/
	Ext.form.field.ComboBox.override( {
		setValue: function(v) {
			if( Ext.JSON.decode(v,true) != null ) {
				arguments[0] = Ext.JSON.decode(v) ;
			}
			this.callOverridden(arguments);
		},
		checkValueOnChange: function() {
			var me = this,
					store = me.getStore();

			// Will be triggered by removal of filters upon destroy
			if (!me.destroying && store.isLoaded()) {
					// If multiselecting and the base store is modified, we may have to remove records from the valueCollection
					// if they have gone from the base store, or update the rawValue if selected records are mutated.
					// TODO: 5.1.1: Use a ChainedStore for multiSelect so that selected records are not filtered out of the
					// base store and are able to be removed.
					// See https://sencha.jira.com/browse/EXTJS-16096
					if (me.multiSelect) {
						// TODO: Implement in 5.1.1 when selected records are available for modification and not filtered out.
						// valueCollection must be in sync with what's available in the base store, and rendered rawValue/tags
						// must match any updated data.
					}
					else {
						if (me.forceSelection && !me.changingFilters && !me.findRecordByValue(me.value)) {
							// skip this if query mode is remote and the user is typing or is executing a page load 
							if (me.queryMode != 'local' && (me.hasFocus || me.isPaging)) {
									return;
							}
							me.setValue(null);
						}
					}
			}
		}
	});
	
	/*
	DATE FIELD : treat 0000-00-00 as null
	*/
	Ext.form.field.Date.override( {
		setValue: function() {
			if( arguments[0] == '0000-00-00' ) {
				arguments[0] = null ;
			}
			this.callOverridden(arguments);
		}
	});
	
	/*
	 * Hide grouping summary if empty
	 */
	Ext.grid.feature.GroupingSummary.override({
		outputSummaryRecord: function(summaryRecord, contextValues, out) {
			var view = contextValues.view,
					columns = contextValues.columns || view.headerCt.getVisibleGridColumns(),
					colCount = columns.length, i, column,
					isNull = true ;
			for (i = 0; i < colCount; i++) {
					column = columns[i];
				if (!column.summaryType) {
					continue ;
				}
				if( !column.dataIndex || summaryRecord.get(column.dataIndex) == null ) {
					continue ;
				}
				isNull = false ;
			}
			
			if( isNull ) {
				return ;
			}
			this.callOverridden(arguments) ;
		}
	}) ;
	
	
	
	
	/*
	 * From Ext 5.1.1, Floating inside other ELs seem to mess with Ext.dom.GarbageCollector
	 * Guess: Ext.util.Floating tries to reuse shadows cleared/invalidated by garbageCollector before ???
	 */
	Ext.util.Floating.override({
		//shadow: false
	}) ;
	Ext.dom.Underlay.override({
		hide: function() {
			this.callOverridden(arguments) ;
			this.getPool().reset() ;
		}
	}) ;
	
	/*
	 * Ext 5.1.1 : BufferedRenderer + Locking + GroupingSummary = bug on destroy if store updated 
	 * https://www.sencha.com/forum/showthread.php?303291-Grid-BufferedRenderer-Locking-GroupingSummary-bug-on-destroy-if-store-updated
	 * Seems GlobalEvent 'afterlayout' set in Ext.grid.locking.View::onUpdate is not consumed until final destroy (where it's too late to dig up records ?)
	 */
	Ext.grid.plugin.BufferedRenderer.override({
		refreshSize: function() {
			if( !this.store.data ) {
				return ;
			}
			this.callOverridden(arguments) ;
		}
	});
	
	
	/*
	 * Ext 5.1.1 : bug Store if filtered initially
	 * https://www.sencha.com/forum/showthread.php?301221-Ext-5-1-1-Bug-in-LocalStore-js/page2&s=cdf893beeb58134dad984b372228a60c
	 */
	Ext.data.Store.override({
		getByInternalId: function(internalId) {
			var data = this.getData(),
					keyCfg;
	
			if (data.filtered) {
					if (!data.$hasExtraKeys) {
						keyCfg = {
							byInternalId: {
								property: 'internalId',
								rootProperty: ''
							}
						};
						data.setExtraKeys(keyCfg);
						data.$hasExtraKeys = true;
					}
					data = data.getSource();
			}
	
			if (!data.$hasExtraKeys) {
					data.setExtraKeys(keyCfg || {
						byInternalId: {
							property: 'internalId',
							rootProperty: ''
						}
					});
					data.$hasExtraKeys = true;
			}
	
			return data.byInternalId.get(internalId) || null;
		},
	});
	
	
	/*
	 * Ext 5.1.1 : applyRoot if TreeStore::setRoot() called with NodeInterface
	 */
	Ext.data.TreeStore.override({
		load: function() {
			this.suspendFilters = true ;
			this.callOverridden(arguments) ;
			this.suspendFilters = false ;
			if( this.needsLocalFilter() ) {
				this.onFilterEndUpdate(this.getFilters());
			}
			return this ;
		},
		
		applyRoot: function(newRoot) {
			newRoot = this.callOverridden(arguments) ;
			
			var me = this ;
			if( newRoot && newRoot.isNode && newRoot.isRoot() ) {
				newRoot.store = newRoot.treeStore = me;
			}
			return newRoot ;
		},
		privates: {
			needsLocalFilter: function(force) {
				if( !force && this.suspendFilters ) {
					return false ;
				}
				return this.callOverridden(arguments) ;
			},
			createOperation: function(type, options) {
				if( this.needsLocalFilter(true) ) {
					delete options.filters ;
				}
				return this.callOverridden(arguments) ;
			},
			filterNodes: function(root, node, filterFn) {
				/*
				* https://www.sencha.com/forum/showthread.php?296893-Filtering-tree-store
				*/
				var match = false,
					childNodes = node.childNodes,
					len = childNodes && childNodes.length,
					i, child;
				if (len) {
					for (i = 0; i < len; ++i) {
						// match needs to be true if any child nodes have been found to match
						match = this.filterNodes(root, childNodes[i], filterFn) || match;
					}
				}
				// match if a child matches, or if the current node matches.
				match = match || (node === root || filterFn(node));
				node.set('visible', match, this._silentOptions);
				if( match && node !== root ) { // HACK : DAMS , display children if parent matches
					node.cascadeBy( function(childNode) {
						if( childNode==node ) {
							return ;
						}
						childNode.set('visible', true, this._silentOptions);
					},this) ;
				}
				return match;
			}
 		}
	});
	
	/*
	 * Ext 5.1.1 : onUpdate if filtered => non-existant group => metaGroup isCollapsed not defined
	 * fixed in 5.1.2 ?
	 */
	Ext.grid.feature.GroupStore.override({
		onUpdate: function(store, record, operation, modifiedFieldNames) {
			var me = this,
				groupingFeature = me.groupingFeature ;
			
			if (store.isGrouped() && !groupingFeature.getGroup(record)) {
				me.fireEvent('update', me, record, operation, modifiedFieldNames);
				return ;
			}
			
			this.callOverridden(arguments) ;
		}
	});
	/*
	 * https://www.sencha.com/forum/showthread.php?301099-Grouping-is-not-working-when-value-is-null/page2
	 * http://forums.ext.net/showthread.php?60224&p=275467&viewfull=1#post275467
	 */
	Ext.grid.feature.Grouping.override({
		// Overridden because of #919
		getMetaGroup: function (group) {
			var metaGroupCache = this.metaGroupCache || this.createCache(),
					key,
					metaGroup;

			if (group.isModel) {
					group = this.getGroup(group);
			}

			if (group != null) { // #919. Do not replace with "!==", beucase it should filter for null and undefined.
					key = (typeof group === 'string') ? group : group.getGroupKey();
					metaGroup = metaGroupCache[key];

					if (!metaGroup) {
						metaGroup = metaGroupCache[key] = {
							isCollapsed: false,
							lastGroup: null,
							lastGroupGeneration: null,
							lastFilterGeneration: null,
							aggregateRecord: new Ext.data.Model()
						};

						if (!metaGroupCache.map) {
							metaGroupCache.map = {};
						}

						metaGroupCache.map[key] = true;
					}
			}

			return metaGroup;
		}
	});
	
	/*
	 * Chrome 43 / Charts ? : draw problem
	 */
	Ext.chart.Chart.override({
		initComponent: function() {
			Ext.apply(this,{
				animate: false
			});
			this.callOverridden(arguments);
			this.on('afterrender', function(chart) {
				Ext.defer(function(){chart.redraw();},100,this);
			});
		}
	});
	
	/*
	 * Disable NavigationModels
	 */
	Ext.view.NavigationModel.override({
		focusCls: ''
	});
	Ext.grid.NavigationModel.override({
		focusCls: ''
	});
	
	
	
	Ext.event.publisher.Focus.override({ // input.x-tree-checkbox has no parent Node ????
    doDelegatedEvent: function(e, invokeAfter) {
        var me = this,
            relatedTarget;

		if (Ext.browser.is.Firefox) {
			e = me.callParent([e, false]);
		} else {
			e = me.callSuper([e, false]);
		}

        if (e) {
            if (e.type === 'focusout' && e.target != null) {
                // If focus is departing to the document, there will be no forthcoming focusin event
                // to trigger a focusleave, to fire a focusleave now.
                if (e.relatedTarget == null && !e.target.matches('input.x-tree-checkbox')) {
                    me.processFocusIn(e, e.target, document.body, invokeAfter);
                } else {
						 
					 }
            }
            else {
                relatedTarget = e.relatedTarget;

                // IE reports relatedTarget as either an inaccessible object which coercively equates to null, or just a blank object in the case of focusing from nowhere.
                // So we can't use a truth test ternary expression to substitute in document.body.
                me.processFocusIn(e, (relatedTarget == null || !relatedTarget.tagName) ? document.body : relatedTarget, e.target, invokeAfter);
            }
        }
    }
	});
	
	
	
	/*
	 * EXTJS-23702
	 * https://www.sencha.com/forum/showthread.php?335344-Grid-scrolling-had-been-totally-broken-by-chrome-56-release/page2
	 * https://www.sencha.com/forum/showthread.php?336972-Grid-scrolling-problems
	 * https://www.sencha.com/forum/showthread.php?335344-Grid-scrolling-had-been-totally-broken-by-chrome-56-release
	 */
	Ext.grid.plugin.BufferedRenderer.override({
		onRangeFetched: function(range, start, end, options, fromLockingPartner) {
			var me = this,
					view = me.view,
					oldStart,
					rows = view.all,
					removeCount,
					increment = 0,
					calculatedTop,
					newTop,
					lockingPartner = (view.lockingPartner && !fromLockingPartner && !me.doNotMirror) && view.lockingPartner.bufferedRenderer,
					newRows,
					partnerNewRows,
					topAdditionSize,
					topBufferZone,
					i,
					variableRowHeight = me.variableRowHeight;

			// View may have been destroyed since the DelayedTask was kicked off.
			if (view.isDestroyed) {
					return;
			}

			// If called as a callback from the Store, the range will be passed, if called from renderRange, it won't
			if (range) {
					// Re-cache the scrollTop if there has been an asynchronous call to the server.
					me.scrollTop = me.view.getScrollY();
			} else {
					range = me.store.getRange(start, end);

					// Store may have been cleared since the DelayedTask was kicked off.
					if (!range) {
						return;
					}
			}

			// Best guess rendered block position is start row index * row height.
			calculatedTop = start * me.rowHeight;

			// The new range encompasses the current range. Refresh and keep the scroll position stable
			if (start < rows.startIndex && end > rows.endIndex) {

					// How many rows will be added at top. So that we can reposition the table to maintain scroll position
					topAdditionSize = rows.startIndex - start;

					// MUST use View method so that itemremove events are fired so widgets can be recycled.
					view.clearViewEl(true);
					newRows = view.doAdd(range, start);
					view.fireEvent('itemadd', range, start, newRows);
					for (i = 0; i < topAdditionSize; i++) {
						increment -= newRows[i].offsetHeight;
					}

					// We've just added a bunch of rows to the top of our range, so move upwards to keep the row appearance stable
				newTop = me.bodyTop + increment;
			}
			else {
					// No overlapping nodes, we'll need to render the whole range
					// teleported flag is set in getFirstVisibleRowIndex/getLastVisibleRowIndex if
					// the table body has moved outside the viewport bounds
					if (me.teleported || start > rows.endIndex || end < rows.startIndex) {
						newTop = calculatedTop;

						// If we teleport with variable row height, the best thing is to try to render the block
						// <bufferzone> pixels above the scrollTop so that the rendered block encompasses the
						// viewport. Only do that if the start is more than <bufferzone> down the dataset.
						if (variableRowHeight) {
							topBufferZone = me.scrollTop < me.position ? me.leadingBufferZone : me.trailingBufferZone;
							if (start > topBufferZone) {
									newTop = me.scrollTop - me.rowHeight * topBufferZone;
							}
						}
						// MUST use View method so that itemremove events are fired so widgets can be recycled.
						view.clearViewEl(true);
						me.teleported = false;
					}

					if (!rows.getCount()) {
						newRows = view.doAdd(range, start);
						view.fireEvent('itemadd', range, start, newRows);
					}
					// Moved down the dataset (content moved up): remove rows from top, add to end
					else if (end > rows.endIndex) {
						removeCount = Math.max(start - rows.startIndex, 0);

						// We only have to bump the table down by the height of removed rows if rows are not a standard size
						if (variableRowHeight) {
							increment = rows.item(rows.startIndex + removeCount, true).offsetTop;
						}
						newRows = rows.scroll(Ext.Array.slice(range, rows.endIndex + 1 - start), 1, removeCount, start, end);
						view.el.dom.scrollTop = me.scrollTop; //HACK

						// We only have to bump the table down by the height of removed rows if rows are not a standard size
						if (variableRowHeight) {
							// Bump the table downwards by the height scraped off the top
							newTop = me.bodyTop + increment;
						} else {
							newTop = calculatedTop;
						}
					}
					// Moved up the dataset: remove rows from end, add to top
					else {
						removeCount = Math.max(rows.endIndex - end, 0);
						oldStart = rows.startIndex;
						newRows = rows.scroll(Ext.Array.slice(range, 0, rows.startIndex - start), -1, removeCount, start, end);
						view.el.dom.scrollTop = me.scrollTop; //HACK

						// We only have to bump the table up by the height of top-added rows if rows are not a standard size
						if (variableRowHeight) {
							// Bump the table upwards by the height added to the top
							newTop = me.bodyTop - rows.item(oldStart, true).offsetTop;

							// We've arrived at row zero...
							if (!rows.startIndex) {
									// But the calculated top position is out. It must be zero at this point
									// We adjust the scroll position to keep visual position of table the same.
									if (newTop) {
										view.setScrollY(me.position = (me.scrollTop -= newTop));
										newTop = 0;
									}
							}

							// Not at zero yet, but the position has moved into negative range
							else if (newTop < 0) {
									increment = rows.startIndex * me.rowHeight;
									view.setScrollY(me.position = (me.scrollTop += increment));
									newTop = me.bodyTop + increment;
							}
						} else {
							newTop = calculatedTop;
						}
					}

					// The position property is the scrollTop value *at which the table was last correct*
					// MUST be set at table render/adjustment time
					me.position = me.scrollTop;
			}

			// Position the item container.
			newTop = Math.max(Math.floor(newTop), 0);
			if (view.positionBody) {
					me.setBodyTop(newTop);
			}

			// Sync the other side to exactly the same range from the dataset.
			// Then ensure that we are still at exactly the same scroll position.
			if (newRows && lockingPartner && !lockingPartner.disabled) {
					// Set the pointers of the partner so that its onRangeFetched believes it is at the correct position.
					lockingPartner.scrollTop = lockingPartner.position = me.scrollTop;
					partnerNewRows = lockingPartner.onRangeFetched(null, start, end, options, true);
					if (lockingPartner.bodyTop !== newTop) {
						lockingPartner.setBodyTop(newTop);
					}
					// Set the real scrollY position after the correct data has been rendered there.
					lockingPartner.view.setScrollY(me.scrollTop);

					// Sync the row heights if configured to do so
					if (variableRowHeight && view.ownerGrid.syncRowHeights) {
						me.syncRowHeights(newRows, partnerNewRows);
					}
			}
			return newRows;
		},
	}) ;
	
	
	
	/*
	 * Désactiver le drag&drop file=>browser(open)
	 */
	window.ondragenter = function(e) {
		e.dataTransfer.dropEffect = 'none';
		e.preventDefault();
		return false;
	};
	window.ondragover = function(e) {
		e.preventDefault();
		return false;
	};
	window.ondrop = function(e) {
		return false;
	};
	window.ondragleave = function(e) {
		return false;
	};
	
	/*
	Désactiver le click droit
	*/
	Ext.getDoc().on('contextmenu', function(e){
		e.preventDefault() ;
	}) ;
	Ext.getDoc().on('keydown', function(e){
		if( e.getKey() == e.BACKSPACE && !Ext.Array.contains(['text','password','textarea'], e.getTarget().type) ) {
			e.preventDefault();
		}
	}) ;
	
	// onReady : bootstrap Optima app.
	Ext.create('Optima5.App',{}) ;
	
	
	// Needed by Ext.Scheduler :
	Ext.data.Connection.override({
		parseStatus: function (b) {
			var a = this.callOverridden(arguments);
			if (b === 0) {
					a.success = true
			}
			return a
		}
	});
});
