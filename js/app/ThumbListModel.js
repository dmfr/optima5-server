Ext.define('Optima5.ThumbListModel',{
	extend: 'Ext.data.Model',
	idProperty: 'id',
	fields: [
		{name: 'id',  type:'string'},
		{name: 'title',  type:'string'},
		{name: 'caption',    type:'string'},
		{name: 'iconCls',type:'string'}
	]
});